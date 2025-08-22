const express = require('express');
const { auth, allowRoles, checkBaseAccess } = require('../middleware/auth');
const { writeLog } = require('../middleware/logging');
const Asset = require('../models/Asset');

const router = express.Router();

// Get all assets
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role !== 'Admin' && req.user.baseId) {
      filter.baseId = req.user.baseId._id;
    }

    const assets = await Asset.find(filter).populate('baseId').sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assets', error: error.message });
  }
});

// Create asset
router.post('/', auth, allowRoles(['Admin', 'Base Commander']), writeLog('asset_created', 'asset'), async (req, res) => {
  try {
    const asset = new Asset(req.body);
    await asset.save();
    await asset.populate('baseId');
    
    res.status(201).json({ message: 'Asset created successfully', asset });
  } catch (error) {
    res.status(500).json({ message: 'Error creating asset', error: error.message });
  }
});

// Update asset
router.put('/:id', auth, allowRoles(['Admin', 'Base Commander']), async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('baseId');
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ message: 'Asset updated successfully', asset });
  } catch (error) {
    res.status(500).json({ message: 'Error updating asset', error: error.message });
  }
});

module.exports = router;