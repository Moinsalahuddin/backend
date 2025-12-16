const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueType: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'furniture', 'appliance', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['reported', 'assigned', 'in-progress', 'resolved', 'cancelled'],
    default: 'reported'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);

