import mongoose from 'mongoose';

const productionLineSchema = new mongoose.Schema({
  name: { type: String, required: true },          // e.g., "Line A"
  code: { type: String, required: true, unique: true }, // e.g., "line-a"
  status: { type: String, enum: ['idle','busy','paused','maintenance'], default: 'idle' },
  capacity: { type: Number, default: 1 }, // concurrent jobs capacity
  specialization: [String], // product types this line handles, optional
  queue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  meta: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('ProductionLine', productionLineSchema);
