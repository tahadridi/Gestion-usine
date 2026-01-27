import mongoose from 'mongoose';

const missingMaterialSchema = new mongoose.Schema({
  material: String,
  required: Number,
  currentStock: Number
});

const reclamationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  submittedBy: { type: String, required: true }, // Sender email
  userRole: String,
  timestamp: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },

  // Notification category
  type: { 
    type: String, 
    enum: ['material_unavailable', 'critical_stock', 'system_alert', 'reclamation', 'production_issue'], 
    default: 'material_unavailable' 
  },

  // Info for production/material alerts
  brand: String,
  model: String,
  missingMaterials: [missingMaterialSchema],

  // Info for stock/system alerts
  materialName: String,
  currentStock: Number,
  threshold: Number,

  // Reclamation data (when type is 'reclamation')
  reclamation: reclamationSchema,

  // User information
  submittedBy: { type: String, required: true }, 
  userRole: String, 
  userEmail: String,

  // Priority system
  priority: { type: Number, enum: [1, 2, 3], default: 1 }, 
  // 1=normal, 2=important, 3=critical

  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', notificationSchema);