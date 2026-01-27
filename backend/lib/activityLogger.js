// activityLogger.js
import Activity from '../models/activityModel.js';

export const logActivity = async (user, action, target, details = {}) => {
  try {
    // If user is an object (like req.user), extract the email
    let userIdentifier = user;
    
    if (typeof user === 'object' && user !== null) {
      // Try to get email from user object
      userIdentifier = user.email || user._id || user.fullName || 'Unknown';
    }
    
    const activity = new Activity({
      user: userIdentifier,
      action,
      target,
      details,
      timestamp: new Date()
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking main functionality
  }
};