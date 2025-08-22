const express = require('express');
const { auth, allowRoles } = require('../middleware/auth');
const { writeLog } = require('../middleware/logging');
const Purchase = require('../models/Purchase');
const Asset = require('../models/Asset');

const router = express.Router();

// Get all purchases
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role !== 'Admin' && req.user.baseId) {
      filter.baseId = req.user.baseId._id;
    }

    const purchases = await Purchase.find(filter)
      .populate('assetId baseId createdBy')
      .sort({ createdAt: -1 });
    
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching purchases', error: error.message });
  }
});

// Create purchase
router.post('/', auth, allowRoles(['Admin', 'Logistics Officer']), writeLog('purchase', 'purchase'), async (req, res) => {
  try {
    const purchase = new Purchase({
      ...req.body,
      createdBy: req.user._id,
      totalCost: req.body.quantity * req.body.unitCost
    });

    await purchase.save();
    
    // Update asset closing balance
    await Asset.findByIdAndUpdate(
      req.body.assetId,
      { 
        $inc: { closingBalance: req.body.quantity },
        updatedAt: new Date()
      }
    );

    await purchase.populate('assetId baseId createdBy');
    
    res.status(201).json({ message: 'Purchase recorded successfully', purchase });
  } catch (error) {
    res.status(500).json({ message: 'Error recording purchase', error: error.message });
  }
});

// Update purchase status
router.put('/:id/status', auth, allowRoles(['Admin', 'Logistics Officer']), async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;
    
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { status, deliveryDate: status === 'Delivered' ? deliveryDate || new Date() : null },
      { new: true }
    ).populate('assetId baseId createdBy');
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.json({ message: 'Purchase status updated', purchase });
  } catch (error) {
    res.status(500).json({ message: 'Error updating purchase status', error: error.message });
  }
});

module.exports = router;