import express from "express";
import Notification from "../models/Notification.js";
import { logActivity } from '../lib/activityLogger.js';
const router = express.Router();

// Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create notification (updated to handle reclamations properly)
router.post("/", async (req, res) => {
  try {
    const {
      message,
      type,
      brand,
      model,
      missingMaterials,
      materialName,
      currentStock,
      threshold,
      submittedBy, 
      userRole,
      userEmail,    
      priority,
      reclamation // This should contain title, description, urgency, etc.
    } = req.body;

    // For reclamation type, ensure we have all required fields
    if (type === 'reclamation' && reclamation) {
      if (!reclamation.title || !reclamation.description) {
        return res.status(400).json({ 
          message: "Reclamation title and description are required" 
        });
      }
      
      if (!submittedBy) {
        return res.status(400).json({ 
          message: "Submitted by field is required for reclamations" 
        });
      }
    }

    const notificationData = {
      message,
      type: type || 'material_unavailable',
      brand,
      model,
      missingMaterials: missingMaterials || [],
      materialName,
      currentStock,
      threshold,
      submittedBy: submittedBy || 'system', 
      userRole: userRole || 'system',       
      priority: priority || 1,
      read: false,
      timestamp: new Date()
    };

    if (userEmail) {
      notificationData.userEmail = userEmail;
    }

    // If it's a reclamation, add reclamation data with sender information
    if (reclamation && type === 'reclamation') {
      notificationData.reclamation = {
        title: reclamation.title,
        description: reclamation.description,
        urgency: reclamation.urgency || 'medium',
        status: 'pending',
        submittedBy: submittedBy || 'unknown',
        userRole: userRole || 'user',
        timestamp: new Date()
      };
    }

    const notification = new Notification(notificationData);
    await notification.save();
    
    // Log the activity
    await logActivity(
      submittedBy || 'system', 
      'create', 
      'reclamation', 
      { 
        title: reclamation?.title,
        notificationId: notification._id 
      }
    );
    
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
    await logActivity(req.user?.email || 'Admin', 'delete', 'notification', {
      notificationId: req.params.id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// In your notification routes
// GET /api/notifications/critical
router.get('/critical', async (req, res) => {
  try {
    const criticalAlerts = await Notification.find({
      type: 'critical_stock',
      read: false
    }).sort({ timestamp: -1 });
    
    res.json({ success: true, alerts: criticalAlerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/notifications/:id/acknowledge
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    await logActivity(req.user?.email || 'System', 'acknowledge', 'notification', {
      notificationId: req.params.id,
      type: notification.type
    });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;