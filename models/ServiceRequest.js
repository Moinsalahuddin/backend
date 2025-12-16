const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['room-service', 'wake-up-call', 'transportation', 'laundry', 'spa', 'concierge', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  scheduledTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

