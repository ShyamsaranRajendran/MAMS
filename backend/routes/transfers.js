const express = require('express');
const { auth, allowRoles } = require('../middleware/auth');
const { writeLog } = require('../middleware/logging');
const Transfer = require('../models/Transfer');
const Asset = require('../models/Asset');

const router = express.Router();

// Get all transfers
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role !== 'Admin' && req.user.baseId) {
      filter = {
        $or: [
          { fromBaseId: req.user.baseId._id },
          { toBaseId: req.user.baseId._id }
        ]
      };
    }

    const transfers = await Transfer.find(filter)
      .populate('assetId fromBaseId toBaseId requestedBy approvedBy')
      .sort({ createdAt: -1 });
    
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transfers', error: error.message });
  }
});

// Create transfer request
router.post('/', auth, allowRoles(['Admin', 'Base Commander']), writeLog('transfer', 'transfer'), async (req, res) => {
  try {
    const transfer = new Transfer({
      ...req.body,
      requestedBy: req.user._id
    });

    await transfer.save();
    await transfer.populate('assetId fromBaseId toBaseId requestedBy');
    
    res.status(201).json({ message: 'Transfer request created successfully', transfer });
  } catch (error) {
    res.status(500).json({ message: 'Error creating transfer request', error: error.message });
  }
});

// Approve/Reject transfer
router.put('/:id/status', auth, allowRoles(['Admin', 'Base Commander']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updateData = { 
      status, 
      notes,
      approvedBy: req.user._id,
      approvalDate: new Date()
    };

    if (status === 'Completed') {
      updateData.transferDate = new Date();
    }

    const transfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assetId fromBaseId toBaseId requestedBy approvedBy');

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    // Update asset balances if transfer is completed
    if (status === 'Completed') {
      // Decrease from source base
      await Asset.updateOne(
        { _id: transfer.assetId._id, baseId: transfer.fromBaseId._id },
        { $inc: { closingBalance: -transfer.quantity }, updatedAt: new Date() }
      );

      // Increase in destination base (or create asset if not exists)
      const destinationAsset = await Asset.findOne({
        name: transfer.assetId.name,
        type: transfer.assetId.type,
        baseId: transfer.toBaseId._id
      });

      if (destinationAsset) {
        await Asset.updateOne(
          { _id: destinationAsset._id },
          { $inc: { closingBalance: transfer.quantity }, updatedAt: new Date() }
        );
      } else {
        const newAsset = new Asset({
          name: transfer.assetId.name,
          type: transfer.assetId.type,
          category: transfer.assetId.category,
          model: transfer.assetId.model,
          baseId: transfer.toBaseId._id,
          openingBalance: 0,
          closingBalance: transfer.quantity
        });
        await newAsset.save();
      }
    }

    res.json({ message: 'Transfer status updated successfully', transfer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating transfer status', error: error.message });
  }
});

module.exports = router;