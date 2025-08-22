const express = require('express');
const { auth, allowRoles } = require('../middleware/auth');
const Log = require('../models/Log');

const router = express.Router();

// Get audit logs
router.get('/logs', auth, allowRoles(['Admin', 'Base Commander']), async (req, res) => {
  try {
    const { startDate, endDate, action, limit = 100 } = req.query;
    
    let filter = {};
    
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (action) {
      filter.action = action;
    }

    const logs = await Log.find(filter)
      .populate('userId', 'username email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
});

module.exports = router;