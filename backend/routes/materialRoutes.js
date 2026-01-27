import express from 'express';
import CarGroup from '../models/CarGroup.js';
import Stock from '../models/Stock.js';
import Material from '../models/materials.js'
import { logActivity } from '../lib/activityLogger.js';
const router = express.Router();

// Helper function to sync stock with CarGroup materials
const syncStockWithCarGroup = async () => {
  try {
    // Get all materials from CarGroup
    const carGroupDoc = await CarGroup.findOne({});
    if (!carGroupDoc) return [];

    const uniqueMaterials = new Set();
    carGroupDoc.groups.forEach(group => {
      group.brands.forEach(brand => {
        brand.materials.forEach(materialName => {
          uniqueMaterials.add(materialName);
        });
      });
    });

    // Ensure each material exists in Stock
    for (const materialName of uniqueMaterials) {
      const existingStock = await Stock.findOne({ materialName });
      if (!existingStock) {
        // Create new stock entry for missing material
        await Stock.create({
          materialName,
          available: false,
          quantity: 0
        });
        console.log(`Created stock entry for: ${materialName}`);
      }
    }

    return Array.from(uniqueMaterials);
  } catch (error) {
    console.error('Error syncing stock with CarGroup:', error);
    return [];
  }
};

// GET all materials with stock information (automatically syncs)
router.get('/all', async (req, res) => {
  try {
    // Sync stock with CarGroup materials first
    await syncStockWithCarGroup();

    // Get all stock items
    const stockItems = await Stock.find().sort({ materialName: 1 });

    // Get CarGroup data to associate brands and models
    const carGroupDoc = await CarGroup.findOne({});
    const materialSources = {};

    if (carGroupDoc) {
      carGroupDoc.groups.forEach(group => {
        group.brands.forEach(brand => {
          brand.materials.forEach(materialName => {
            if (!materialSources[materialName]) {
              materialSources[materialName] = {
                brands: new Set(),
                models: new Set()
              };
            }
            materialSources[materialName].brands.add(brand.name);
            materialSources[materialName].models = new Set([
              ...materialSources[materialName].models,
              ...brand.models
            ]);
          });
        });
      });
    }

    // Combine stock data with CarGroup information
    const materialsWithDetails = stockItems.map(stockItem => {
      const sources = materialSources[stockItem.materialName] || { brands: new Set(), models: new Set() };
      
      return {
        _id: stockItem._id,
        name: stockItem.materialName,
        brands: Array.from(sources.brands).join(', '),
        models: Array.from(sources.models).join(', '),
        available: stockItem.available,
        quantity: stockItem.quantity,
        lastUpdated: stockItem.lastUpdated
      };
    });

    res.json({
      success: true,
      data: materialsWithDetails
    });
  } catch (err) {
    console.error('Error fetching all materials:', err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// UPDATE material stock
// UPDATE material stock
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { available, quantity } = req.body;

    // Get the current stock value first - use findOne if findById doesn't work
    const oldStock = await Stock.findById(id);
    
    if (!oldStock) {
      return res.status(404).json({ success: false, error: "Material not found" });
    }

    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      { 
        available,
        quantity,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedStock) {
      return res.status(404).json({ success: false, error: "Material not found" });
    }
    
    // Log the activity with the old stock quantity - add proper checks
    await logActivity(req.user?.email || 'Admin', 'update', 'stock', {
      materialId: id,
      materialName: updatedStock.materialName,
      newQuantity: quantity !== undefined ? quantity : updatedStock.quantity,
      previousQuantity: oldStock.quantity !== undefined ? oldStock.quantity : 0
    });

    res.json({
      success: true,
      data: updatedStock
    });
  } catch (err) {
    console.error('Error updating material stock:', err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
// ADD new material to stock (only if it exists in CarGroup)
router.post('/', async (req, res) => {
  try {
    const { materialName, available, quantity } = req.body;

    // Check if material exists in CarGroup
    const carGroupDoc = await CarGroup.findOne({
      "groups.brands.materials": materialName
    });

    if (!carGroupDoc) {
      return res.status(400).json({ 
        success: false, 
        error: "Material does not exist in CarGroup database" 
      });
    }

    const newStock = new Stock({
      materialName,
      available: available || false,
      quantity: quantity || 0,
      lastUpdated: new Date()
    });

    await newStock.save();
    await logActivity(req.user?.email || 'Admin', 'create', 'stock item', {
  materialName: req.body.materialName,
  quantity: req.body.quantity || 0
});

    res.json({
      success: true,
      data: newStock
    });
  } catch (err) {
    console.error('Error adding material to stock:', err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
// GET materials by brand and model
router.get('/', async (req, res) => {
  try {
    const { brand, model } = req.query;
    
    if (!brand || !model) {
      return res.status(400).json({
        success: false,
        error: "Brand and model parameters are required"
      });
    }

    // Find the CarGroup document
    const carGroup = await CarGroup.findOne({});

    if (!carGroup) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Extract materials for the specific brand and model
    let materials = [];
    
    carGroup.groups.forEach(group => {
      group.brands.forEach(brandItem => {
        // Case-insensitive comparison for brand name
        if (brandItem.name.toLowerCase() === brand.toLowerCase()) {
          // Check if this brand has the requested model
          const modelExists = brandItem.models.some(
            m => m.toLowerCase() === model.toLowerCase()
          );
          
          if (modelExists) {
            materials = brandItem.materials;
          }
        }
      });
    });

    res.json({
      success: true,
      data: materials
    });
  } catch (err) {
    console.error('Error fetching materials by brand/model:', err);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

export default router;