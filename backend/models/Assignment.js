const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
  },
  personnelId: {
    type: String,
    required: true,
    trim: true
  },
  personnelName: {
    type: String,
    required: true,
    trim: true
  },
  rank: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  assignmentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  returnDate: {
    type: Date,
    default: null
  },
  expendedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Assigned', 'Returned', 'Expended', 'Lost', 'Damaged'],
    default: 'Assigned'
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);