import mongoose from 'mongoose';

const reclamationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  submittedBy: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'operator'
  },
  product: {
    name: String,
    brand: String,
    model: String,
    productId: String
  },
  priority: {
    type: Number,
    enum: [1, 2, 3], // 1=low, 2=medium, 3=high
    default: 2
  },
  comments: [{
    user: String,
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    resolvedBy: String,
    resolutionNote: String,
    resolvedAt: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Reclamation', reclamationSchema);