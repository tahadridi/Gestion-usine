import express from 'express';
import Product from '../models/products.js';
import { logActivity } from '../lib/activityLogger.js';
const router = express.Router();

// Get all products or check existence
router.get('/', async (req, res) => {
  try {
    const { brand, model, type } = req.query;

    if (brand && model && type) {
      // Check if a product already exists
      const existingProduct = await Product.findOne({ brand, model, type });
      return res.json({ exists: !!existingProduct });
    }

    // Otherwise return all products
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product
router.post('/', async (req, res) => {
  try {
    const { brand, model, group, name, type, materials, image } = req.body;

    if (!brand || !model || !group || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check duplicate before saving
    const existingProduct = await Product.findOne({ brand, model, type });
    if (existingProduct) {
      return res.status(400).json({ error: 'Product already exists' });
    }

    const product = new Product({
      brand,
      model,
      name: name || `${brand} ${model} ${type === 'steering' ? 'Steering Wheel' : 'Airbag'}`,
      type,
      group,
      materials: materials || [],
      image
    });
    await product.save();
    await logActivity(req.user?.email || 'Admin', 'create', 'product', {
  productId: product._id, 
  name: product.name,
  type: product.type
});
    res.status(201).json(product);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
  
});
// Delete product by ID (inline)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
