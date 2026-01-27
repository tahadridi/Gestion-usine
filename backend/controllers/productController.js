//i didint use this file


const Product = require('../models/products');

// Get all
exports.getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

// Create
exports.createProduct = async (req, res) => {
  const product = new Product(req.body);
  const saved = await product.save();
  res.json(saved);
};

// Update
exports.updateProduct = async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

exports.deleteProduct = async (req, res) => {
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
};

