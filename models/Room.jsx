const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  roomType: {
    type: String,
    required: true,
    enum: ['Single', 'Double', 'Suite', 'Deluxe', 'Presidential'],
    trim: true
  },
  floor: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'maintenance', 'reserved'],
    default: 'available'
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{
    type: String
  }],
  maxOccupancy: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);


