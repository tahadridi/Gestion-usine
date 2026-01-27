import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Stock', stockSchema);
