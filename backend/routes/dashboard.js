const express = require('express');
const { auth, allowRoles } = require('../middleware/auth');
const Asset = require('../models/Asset');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const Base = require('../models/Base');

const router = express.Router();

router.get('/metrics', auth, async (req, res) => {
  try {
    let baseFilter = {};
    
    if (req.user.role !== 'Admin' && req.user.baseId) {
      baseFilter = { baseId: req.user.baseId._id };
    }

    // Get asset counts by type
    const assetsByType = await Asset.aggregate([
      { $match: baseFilter },
      { 
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalValue: { $sum: '$closingBalance' }
        }
      }
    ]);

    // Get recent transfers
    const recentTransfers = await Transfer.find(baseFilter.baseId ? {
      $or: [
        { fromBaseId: baseFilter.baseId },
        { toBaseId: baseFilter.baseId }
      ]
    } : {})
      .populate('assetId fromBaseId toBaseId requestedBy')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get active assignments
    const activeAssignments = await Assignment.countDocuments({
      ...baseFilter,
      status: 'Assigned'
    });

    // Get pending transfers
    const pendingTransfers = await Transfer.countDocuments({
      ...(baseFilter.baseId ? {
        $or: [
          { fromBaseId: baseFilter.baseId },
          { toBaseId: baseFilter.baseId }
        ]
      } : {}),
      status: 'Pending'
    });

    // Get total assets
    const totalAssets = await Asset.countDocuments(baseFilter);

    // Get low stock alerts
    const lowStockAssets = await Asset.find({
      ...baseFilter,
      closingBalance: { $lt: 10 }
    }).populate('baseId');

    res.json({
      overview: {
        totalAssets,
        activeAssignments,
        pendingTransfers,
        lowStockCount: lowStockAssets.length
      },
      assetsByType,
      recentTransfers,
      lowStockAssets
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard metrics', error: error.message });
  }
});

router.get('/analytics', auth, allowRoles(['Admin', 'Base Commander']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let baseFilter = {};
    if (req.user.role !== 'Admin' && req.user.baseId) {
      baseFilter = { baseId: req.user.baseId._id };
    }

    // Monthly purchase trends
    const purchaseTrends = await Purchase.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalPurchases: { $sum: 1 },
          totalValue: { $sum: '$totalCost' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Transfer patterns
    const transferPatterns = await Transfer.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      purchaseTrends,
      transferPatterns
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

module.exports = router;