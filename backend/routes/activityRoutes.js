import express from 'express';
import Activity from '../models/activityModel.js'; // Change to .js extension

const router = express.Router();

// Get all activities with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Activity.countDocuments();
    
    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new activity
router.post('/', async (req, res) => {
  const activity = new Activity({
    user: req.body.user,
    action: req.body.action,
    target: req.body.target,
    details: req.body.details
  });

  try {
    const newActivity = await activity.save();
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router; // Change to export default