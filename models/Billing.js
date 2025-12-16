const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomCharges: {
    type: Number,
    required: true,
    min: 0
  },
  additionalServices: [{
    serviceName: {
      type: String,
      required: true
    },
    serviceType: {
      type: String,
      enum: ['food', 'laundry', 'transportation', 'spa', 'other'],
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  taxes: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
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
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank-transfer', 'other']
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
});

// Generate invoice number before saving
billingSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = 'INV' + Date.now().toString().slice(-10) + Math.random().toString(36).substr(2, 3).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Billing', billingSchema);

