import { group } from 'console';
import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  name: String,
  quantity: Number
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  group: { type: String, required: true },
  type: { type: String, enum: ['steering', 'airbag'], required: true },
  image: { type: String }, 
  materials: [materialSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);