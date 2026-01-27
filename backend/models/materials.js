import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  name: { type: String, required: true },
  stock: { type: Number, default: 0 } // quantity in stock
});

export default mongoose.model('Material', materialSchema);