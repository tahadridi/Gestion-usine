import express from 'express';
import Reclamation from '../models/reclamation.js';
import { logActivity } from '../lib/activityLogger.js';

const router = express.Router();

// Get all reclamations
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const reclamations = await Reclamation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Reclamation.countDocuments(query);

    res.json({
      reclamations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get reclamation by ID
router.get('/:id', async (req, res) => {
  try {
    const reclamation = await Reclamation.findById(req.params.id);
    if (!reclamation) {
      return res.status(404).json({ message: 'Reclamation not found' });
    }
    res.json(reclamation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new reclamation
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      urgency,
      submittedBy,
      userEmail,
      userRole,
      product,
      priority
    } = req.body;

    // Validate required fields
    if (!title || !description || !submittedBy || !userEmail) {
      return res.status(400).json({ 
        message: 'Title, description, submittedBy, and userEmail are required' 
      });
    }

    const reclamation = new Reclamation({
      title,
      description,
      urgency: urgency || 'medium',
      submittedBy,
      userEmail,
      userRole: userRole || 'operator',
      product: product || {},
      priority: priority || (urgency === 'high' ? 3 : urgency === 'medium' ? 2 : 1),
      status: 'pending'
    });

    const savedReclamation = await reclamation.save();

    // Log activity
    await logActivity(
      userEmail, 
      'create', 
      'reclamation', 
      { 
        reclamationId: savedReclamation._id,
        title: savedReclamation.title
      }
    );

    res.status(201).json(savedReclamation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update reclamation status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, resolvedBy, resolutionNote } = req.body;
    
    const updateData = { status };
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolution = {
        resolvedBy: resolvedBy || 'system',
        resolutionNote: resolutionNote || '',
        resolvedAt: new Date()
      };
    }

    const reclamation = await Reclamation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!reclamation) {
      return res.status(404).json({ message: 'Reclamation not found' });
    }

    await logActivity(
      resolvedBy || 'system', 
      'update', 
      'reclamation_status', 
      { 
        reclamationId: reclamation._id,
        newStatus: status
      }
    );

    res.json(reclamation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add comment to reclamation
router.post('/:id/comments', async (req, res) => {
  try {
    const { user, comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const reclamation = await Reclamation.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: user || 'Anonymous',
            comment
          }
        }
      },
      { new: true }
    );

    if (!reclamation) {
      return res.status(404).json({ message: 'Reclamation not found' });
    }

    res.json(reclamation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete reclamation
router.delete('/:id', async (req, res) => {
  try {
    const reclamation = await Reclamation.findByIdAndDelete(req.params.id);
    
    if (!reclamation) {
      return res.status(404).json({ message: 'Reclamation not found' });
    }

    await logActivity(
      'system', 
      'delete', 
      'reclamation', 
      { 
        reclamationId: req.params.id,
        title: reclamation.title
      }
    );

    res.json({ message: 'Reclamation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;