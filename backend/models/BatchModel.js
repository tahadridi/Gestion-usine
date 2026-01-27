import mongoose from 'mongoose';
import { protectRoute } from '../middleware/auth.middleware.js';
const materialSchema = new mongoose.Schema({
  name: String,
  quantity: Number
});
const materialUsageSchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  quantityUsed: { type: Number, required: true }
});
const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional ref
  productName: { type: String, required: true },
  productGroup: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  submittedBy: { type: String }, // user id/name
  status: { type: String, enum: ['pending','assigned','in-production','paused','completed','cancelled'], default: 'pending' },
  completedLineName: String,
  assignedLine: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionLine', default: null },
  progress: { type: Number, default: 0 }, // 0..100
  materials: [materialSchema],
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date,
  meta: { type: mongoose.Schema.Types.Mixed },
  materialsUsed: [materialUsageSchema], // Track what materials were used
  stockDeducted: { type: Boolean, default: false } ,// Flag to prevent double deduction
  submittedBy: { type: String, required: true },
  submittedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: String,
});

export default mongoose.model('Batch', batchSchema);
