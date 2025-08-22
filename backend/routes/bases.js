const express = require('express');
const { auth, allowRoles } = require('../middleware/auth');
const Base = require('../models/Base');

const router = express.Router();

// Get all bases
router.get('/', auth, async (req, res) => {
  try {
    const bases = await Base.find({ isActive: true })
      .populate('commanderId', 'username email')
      .sort({ name: 1 });
    
    res.json(bases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bases', error: error.message });
  }
});

// Create base
router.post('/', auth, allowRoles(['Admin']), async (req, res) => {
  try {
    const base = new Base(req.body);
    await base.save();
    await base.populate('commanderId', 'username email');
    
    res.status(201).json({ message: 'Base created successfully', base });
  } catch (error) {
    res.status(500).json({ message: 'Error creating base', error: error.message });
  }
});

module.exports = router;