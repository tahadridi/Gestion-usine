import express from 'express';
import Stock from '../models/Stock.js';
import { logActivity } from '../lib/activityLogger.js';
const router = express.Router();

// Get all materials
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find();
    return res.json(stocks);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Add new material
router.post('/', async (req, res) => {
  try {
    const stock = new Stock(req.body);
    await stock.save();

    // log first (or wrap in try/catch)
    try {
      await logActivity(req.user?.email || 'Admin', 'create', 'stock', {
        materialName: stock.materialName,
        quantity: stock.quantity
      });
    } catch (logErr) {
      console.error('Log activity failed:', logErr.message);
    }

    return res.status(201).json(stock);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Update material by id
router.put('/:id', async (req, res) => {
  try {
    const stock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!stock) {
      return res.status(404).json({ message: 'Material not found' });
    }

    try {
      await logActivity(req.user?.email || 'Admin', 'update', 'stock', {
        materialName: stock.materialName,
        updatedFields: req.body
      });
    } catch (logErr) {
      console.error('Log activity failed:', logErr.message);
    }

    return res.json(stock);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// DELETE material by id
router.delete('/:id', async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Material not found' });
    }

    try {
      await logActivity(req.user?.email || 'Admin', 'delete', 'stock', {
        materialName: stock.materialName,
        quantity: stock.quantity
      });
    } catch (logErr) {
      console.error('Log activity failed:', logErr.message);
    }

    return res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
