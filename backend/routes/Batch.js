import express from 'express';
import Batch from '../models/BatchModel.js';
import ProductionLine from '../models/ProductionLine.js';
import Stock from '../models/Stock.js';          // <--- add this
import Notification from '../models/Notification.js'; // <--- add this
import { logActivity } from '../lib/activityLogger.js';

const router = express.Router();

// Scoring algorithm for line assignment
const scoreLine = (line, batch) => {
  let score = 0;

  if (line.status === 'idle') score += 50;
  if (line.status === 'busy') score += 10;
  if (line.status === 'maintenance') score -= 1000;

  if (line.meta?.group && batch.productGroup && line.meta.group === batch.productGroup) {
    score += 40;
  }

  const batchMaterials = batch.materials?.map(m => m.name || m) || [];
  if (line.specialization && batchMaterials.length > 0) {
    batchMaterials.forEach(mat => {
      if (line.specialization.includes(mat)) score += 15;
    });
  }

  const queueLength = line.queue?.length || 0;
  score -= queueLength * 5;

  return score;
};

// Function to start a batch on a line (can be called manually or automatically)
const startBatchOnLine = async (batch, io) => {
  const lines = await ProductionLine.find().populate('queue').exec();
  if (!lines || lines.length === 0) return null;

  let bestLine = null;
  let bestScore = -1000;

  for (const line of lines) {
    const score = scoreLine(line, batch);
    if (score > bestScore) {
      bestScore = score;
      bestLine = line;
    }
  }

  if (bestLine && bestScore > 0) {
    batch.assignedLine = bestLine._id;

    if (bestLine.status === 'idle') {
      // Start immediately
      batch.status = 'in-production';
      batch.startedAt = new Date();
      bestLine.status = 'busy';
    } else {
      // Just enqueue, do not start yet
      batch.status = 'pending';
    }

    await batch.save();
    await logActivity('admin' || 'System', 'start', 'batch', {
  batchId: batch.batchId, 
  product: batch.productName,
  quantity: batch.quantity
});

    bestLine.queue.push(batch._id);
    bestLine.updatedAt = new Date();
    await bestLine.save();

    if (io) {
      io.emit('batchAssigned', {
        batchId: batch.batchId,
        lineId: bestLine._id,
        lineName: bestLine.name,
        status: batch.status
      });
    }
  }

  return { batch, bestLine };
};

// POST /api/batches/start
router.post('/start', async (req, res) => {
  try {
    const { batchId, productId, productName, productGroup, quantity = 1, materials = [], submittedBy } = req.body;

    if (!batchId || !productName) {
      return res.status(400).json({ success: false, message: 'batchId and productName are required' });
    }

    const batch = new Batch({ batchId, productId, productName, productGroup, quantity, materials, submittedBy, status: 'pending' });
    await batch.save();

    const result = await startBatchOnLine(batch, req.app.get('io'));
    
    // Emit event for new batch creation
    const io = req.app.get('io');
    if (io) {
      io.emit('batchCreated', { batch });
    }
    
    res.status(201).json({ success: true, batch: result?.batch, assignedLine: result?.bestLine });
  } catch (err) {
    console.error('Start batch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/batches/:id/progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    batch.progress = progress || 0;
    const io = req.app.get('io');

    // Handle completion
    if (batch.progress >= 100 && batch.status !== 'completed') {
      batch.status = 'completed';
      batch.completedAt = new Date();
      await logActivity('System', 'complete', 'batch', {
  batchId: batch.batchId, 
  product: batch.productName
});

      // ✅ Deduct stock if not already done
      if (!batch.stockDeducted) {
        try {
          for (const material of batch.materials) {
            const materialName = material.name || material;
            const quantityUsed = (material.quantity || 1) * batch.quantity;

            const stockItem = await Stock.findOne({
              materialName: new RegExp(`^${materialName}$`, 'i')
            });

            if (stockItem) {
              stockItem.quantity = Math.max(0, stockItem.quantity - quantityUsed);
              stockItem.available = stockItem.quantity > 0;
              stockItem.lastUpdated = new Date();

              await stockItem.save();

              // Record usage in batch
              batch.materialsUsed.push({
                materialName: stockItem.materialName,
                quantityUsed
              });

              // Critical alert if below threshold
              const threshold = 10; // 🔧 adjust as needed
              if (stockItem.quantity <= threshold) {
                await Notification.create({
                  message: `CRITICAL: ${stockItem.materialName} stock is low (${stockItem.quantity} remaining)`,
                  type: 'critical_stock',
                  materialName: stockItem.materialName,
                  currentStock: stockItem.quantity,
                  threshold,
                  priority: 3, // mark as critical
                  read: false,
                  timestamp: new Date()
                });
              }
            }
          }

          batch.stockDeducted = true;
        } catch (err) {
          console.error('Error deducting materials:', err);
        }
      }

      // Handle assigned line cleanup
      if (batch.assignedLine) {
        const line = await ProductionLine.findById(batch.assignedLine).exec();
        if (line) {
          batch.completedLineName = line.name;
          line.queue = line.queue.filter(qId => qId.toString() !== batch._id.toString());
          if (line.queue.length === 0) line.status = 'idle';
          line.updatedAt = new Date();
          await line.save();

          if (io) {
            io.emit('lineStatusUpdated', { lineId: line._id, status: line.status });
          }
        }
      }

      batch.assignedLine = null;

      if (io) {
        io.emit('batchCompleted', { batchId: batch._id });
      }
    }

    await batch.save();

    // Emit progress update
    if (io) {
      io.emit('batchProgress', {
        batchId: batch._id,
        progress: batch.progress,
        status: batch.status
      });
    }

    res.json({ success: true, batch });
  } catch (err) {
    console.error('Update progress error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find().populate('assignedLine').sort({ createdAt: -1 }).exec();
    res.json({ success: true, batches });
  } catch (err) {
    console.error('Get batches error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET batch by ID
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('assignedLine').exec();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (err) {
    console.error('Get batch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE batch
router.delete('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (batch.assignedLine) {
      const line = await ProductionLine.findById(batch.assignedLine).populate('queue').exec();
      if (line) {
        line.queue = line.queue.filter(id => id.toString() !== batch._id.toString());
        
        // If this was the current batch, start the next one if available
        if (line.queue.length > 0 && batch.status === 'in-production') {
          const nextBatchId = line.queue[0];
          const nextBatch = await Batch.findById(nextBatchId);
          
          if (nextBatch && nextBatch.status === 'pending') {
            nextBatch.status = 'in-production';
            nextBatch.startedAt = new Date();
            await nextBatch.save();
            
            // Emit next batch started
            const io = req.app.get('io');
            if (io) {
              io.emit('batchStarted', {
                batchId: nextBatch.batchId,
                lineId: line._id,
                lineName: line.name,
                batch: nextBatch
              });
            }
          }
        } else if (line.queue.length === 0) {
          line.status = 'idle';
        }
        
        line.updatedAt = new Date();
        await line.save();
        
        // Emit line status update
        const io = req.app.get('io');
        if (io) {
          io.emit('lineStatusUpdated', {
            lineId: line._id,
            status: line.status,
            queue: line.queue
          });
        }
      }
    }
    await logActivity(req.user?.email || 'Admin', 'delete', 'batch', {
  batchId: batch.batchId, 
  product: batch.productName
});
    await Batch.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('batchCancelled', { batchId: batch.batchId });

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    console.error('Delete batch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;