import express from 'express';
import ProductionLine from '../models/ProductionLine.js';
import Batch from '../models/BatchModel.js';

const router = express.Router();

// GET /api/production-lines - Get all production lines
router.get('/', async (req, res) => {
  try {
    const lines = await ProductionLine.find()
      .populate({
        path: 'queue',
        select: 'batchId productName progress quantity status'
      })
      .sort({ name: 1 })
      .exec();
    
    res.json({ success: true, lines });
  } catch (err) {
    console.error('Get production lines error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/production-lines/:id/status - Update line status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['idle', 'busy', 'paused', 'maintenance'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: idle, busy, paused, or maintenance' 
      });
    }

    const line = await ProductionLine.findById(req.params.id).populate('queue');
    if (!line) {
      return res.status(404).json({ success: false, message: 'Production line not found' });
    }

    const oldStatus = line.status;
    line.status = status;
    line.updatedAt = new Date();
    
    // If changing from maintenance to idle and there are queued batches, start the first one
    if (oldStatus === 'maintenance' && status === 'idle' && line.queue.length > 0) {
      const firstBatch = line.queue[0];
      if (firstBatch.status === 'pending') {
        firstBatch.status = 'in-production';
        firstBatch.startedAt = new Date();
        await firstBatch.save();
        
        line.status = 'busy';
        
        // Emit batch started
        const io = req.app.get('io');
        if (io) {
          io.emit('batchStarted', {
            batchId: firstBatch.batchId,
            lineId: line._id,
            lineName: line.name,
            batch: firstBatch
          });
        }
      }
    }
    
    // If pausing a line with an active batch, pause the batch too
    if (status === 'paused' && line.queue.length > 0) {
      const currentBatch = line.queue[0];
      if (currentBatch.status === 'in-production') {
        currentBatch.status = 'paused';
        await currentBatch.save();
        
        // Emit batch paused
        const io = req.app.get('io');
        if (io) {
          io.emit('batchStatusUpdated', {
            batchId: currentBatch._id,
            status: 'paused',
            progress: currentBatch.progress,
            batch: currentBatch
          });
        }
      }
    }
    
    // If resuming a paused line, resume the batch too
    if (oldStatus === 'paused' && status === 'busy' && line.queue.length > 0) {
      const currentBatch = line.queue[0];
      if (currentBatch.status === 'paused') {
        currentBatch.status = 'in-production';
        await currentBatch.save();
        
        // Emit batch resumed
        const io = req.app.get('io');
        if (io) {
          io.emit('batchStatusUpdated', {
            batchId: currentBatch._id,
            status: 'in-production',
            progress: currentBatch.progress,
            batch: currentBatch
          });
        }
      }
    }

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

    res.json({ success: true, line });
  } catch (err) {
    console.error('Update line status error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;