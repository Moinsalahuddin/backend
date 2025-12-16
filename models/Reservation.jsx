const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    trim: true
  },
  bookingSource: {
    type: String,
    enum: ['online', 'phone', 'walk-in', 'agent'],
    default: 'online'
  },
  confirmationNumber: {
    type: String,
    unique: true
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

// Generate confirmation number before saving
reservationSchema.pre('save', async function(next) {
  if (!this.confirmationNumber) {
    // Generate unique confirmation number
    const Reservation = this.constructor;
    let confirmationNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      confirmationNumber = 'LUX' + timestamp + random;
      
      // Check if this confirmation number already exists
      const existing = await Reservation.findOne({ confirmationNumber });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      // Fallback: use timestamp + random if uniqueness check fails
      confirmationNumber = 'LUX' + Date.now().toString() + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    this.confirmationNumber = confirmationNumber;
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);


