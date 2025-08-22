const express = require('express');
const { auth, allowRoles } = require('../middleware/auth');
const { writeLog } = require('../middleware/logging');
const Assignment = require('../models/Assignment');
const Asset = require('../models/Asset');

const router = express.Router();

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role !== 'Admin' && req.user.baseId) {
      filter.baseId = req.user.baseId._id;
    }

    const assignments = await Assignment.find(filter)
      .populate('assetId baseId assignedBy')
      .sort({ createdAt: -1 });
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// Create assignment
router.post('/', auth, allowRoles(['Admin', 'Base Commander']), writeLog('assignment', 'assignment'), async (req, res) => {
  try {
    const assignment = new Assignment({
      ...req.body,
      assignedBy: req.user._id
    });

    await assignment.save();

    // Update asset closing balance
    await Asset.findByIdAndUpdate(
      req.body.assetId,
      { 
        $inc: { closingBalance: -req.body.quantity },
        updatedAt: new Date()
      }
    );

    await assignment.populate('assetId baseId assignedBy');
    
    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
});

// Mark assignment as expended
router.post('/expended', auth, allowRoles(['Admin', 'Base Commander']), async (req, res) => {
  try {
    const { assignmentId, expendedDate, notes } = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      {
        status: 'Expended',
        expendedDate: expendedDate || new Date(),
        notes: notes || assignment.notes
      },
      { new: true }
    ).populate('assetId baseId assignedBy');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment marked as expended', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error marking assignment as expended', error: error.message });
  }
});

// Return assignment
router.put('/:id/return', auth, allowRoles(['Admin', 'Base Commander']), async (req, res) => {
  try {
    const { returnedQuantity, notes } = req.body;
    
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Returned',
        returnDate: new Date(),
        notes: notes || assignment.notes
      },
      { new: true }
    ).populate('assetId baseId assignedBy');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Return quantity to asset balance
    await Asset.findByIdAndUpdate(
      assignment.assetId._id,
      { 
        $inc: { closingBalance: returnedQuantity || assignment.quantity },
        updatedAt: new Date()
      }
    );

    res.json({ message: 'Assignment returned successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error returning assignment', error: error.message });
  }
});

module.exports = router;