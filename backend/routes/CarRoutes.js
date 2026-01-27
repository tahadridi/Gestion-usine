import express from 'express';
import CarGroup from '../models/CarGroup.js';

const router = express.Router();

// Helper function to format groups data
const formatGroupsData = (groups) => {
  return groups.map(group => ({
    groupName: group.group,
    brands: group.brands.map(brand => ({
      name: brand.name,
      models: brand.models,
      materials:brand.materials
    }))
  }));
};

// GET all car groups
router.get('/', async (req, res) => {
  try {
    const carGroupDoc = await CarGroup.findOne({});
    
    if (!carGroupDoc || !carGroupDoc.groups || carGroupDoc.groups.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "No car groups found" 
      });
    }

    res.json({
      success: true,
      data: formatGroupsData(carGroupDoc.groups)
    });
  } catch (err) {
    console.error('Error fetching all car groups:', err);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

// GET specific car group by name
router.get('/:groupName', async (req, res) => {
  try {
    const { groupName } = req.params;
    
    // Case-insensitive search
    const carGroupDoc = await CarGroup.findOne({
      "groups.group": { $regex: new RegExp(`^${groupName}$`, 'i') }
    });
    
    if (!carGroupDoc) {
      return res.status(404).json({
        success: false,
        error: `Group '${groupName}' not found`
      });
    }

    const group = carGroupDoc.groups.find(g => 
      g.group.toLowerCase() === groupName.toLowerCase()
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        error: `Group '${groupName}' not found`
      });
    }

    res.json({
      success: true,
      data: formatGroupsData([group])[0] // Return single group
    });
  } catch (err) {
    console.error(`Error fetching group '${req.params.groupName}':`, err);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

export default router;