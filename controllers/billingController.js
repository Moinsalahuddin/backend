const Billing = require('../models/Billing');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const emailService = require('../utils/emailService');
const pdfService = require('../utils/pdfService');
const notificationController = require('./notificationController');
const SystemSettings = require('../models/SystemSettings');
const fs = require('fs');
const path = require('path');

// @desc    Get all bills (with filtering)
// @route   GET /api/billing
// @access  Private
exports.getBills = async (req, res) => {
  try {
    const { reservationId, guestId, paymentStatus } = req.query;
    const query = {};
    
    if (reservationId) query.reservationId = reservationId;
    if (guestId) query.guestId = guestId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Guests can only see their own bills
    if (req.user.role === 'guest') {
      query.guestId = req.user._id;
    }

    const bills = await Billing.find(query)
      .populate('reservationId')
      .populate('guestId', 'firstName lastName email')
      .sort({ issuedAt: -1 });
    
    res.json({ success: true, count: bills.length, bills });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single bill/invoice
// @route   GET /api/billing/:id
// @access  Private
exports.getBill = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('reservationId')
      .populate('guestId', 'firstName lastName email phone address');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Guests can only view their own bills
    if (req.user.role === 'guest' && bill.guestId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new bill/invoice
// @route   POST /api/billing
// @access  Private (Receptionist, Manager, Admin)
exports.createBill = async (req, res) => {
  try {
    const { reservationId, roomCharges, additionalServices, taxes, discount } = req.body;

    const reservation = await Reservation.findById(reservationId).populate('guestId');
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Calculate total from additional services
    let additionalServicesTotal = 0;
    if (additionalServices && Array.isArray(additionalServices)) {
      additionalServices.forEach(service => {
        service.totalPrice = (service.quantity || 1) * service.unitPrice;
        additionalServicesTotal += service.totalPrice;
      });
    }

    const subtotal = roomCharges + additionalServicesTotal;
    const taxAmount = taxes || 0;
    const discountAmount = discount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const bill = await Billing.create({
      reservationId,
      guestId: reservation.guestId._id,
      roomCharges,
      additionalServices: additionalServices || [],
      taxes: taxAmount,
      discount: discountAmount,
      totalAmount
    });

    const populatedBill = await Billing.findById(bill._id)
      .populate('reservationId')
      .populate('guestId', 'firstName lastName email');

    // Send email notification if enabled
    const settings = await SystemSettings.getSettings();
    if (settings.notificationSettings?.emailNotifications && settings.notificationSettings?.notifyOnBooking) {
      const reservation = await Reservation.findById(reservationId).populate('roomId');
      emailService.sendInvoice(populatedBill, reservation.guestId, reservation);
    }

    // Create notification
    notificationController.createNotification(
      reservation.guestId._id,
      'payment',
      'New Invoice Generated',
      `Invoice #${bill._id} has been generated for your reservation.`,
      bill._id,
      'Billing'
    );

    res.status(201).json({ success: true, bill: populatedBill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update payment status
// @route   PUT /api/billing/:id/payment
// @access  Private (Receptionist, Manager, Admin)
exports.updatePayment = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    bill.paymentStatus = req.body.paymentStatus;
    if (req.body.paymentMethod) bill.paymentMethod = req.body.paymentMethod;
    if (req.body.paymentStatus === 'paid') {
      bill.paidAt = new Date();
    }

    await bill.save();

    const populatedBill = await Billing.findById(bill._id)
      .populate('reservationId')
      .populate('guestId', 'firstName lastName email');

    res.json({ success: true, bill: populatedBill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update bill
// @route   PUT /api/billing/:id
// @access  Private (Receptionist, Manager, Admin)
exports.updateBill = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const { additionalServices, taxes, discount } = req.body;

    if (additionalServices && Array.isArray(additionalServices)) {
      bill.additionalServices = additionalServices.map(service => ({
        ...service,
        totalPrice: (service.quantity || 1) * service.unitPrice
      }));
    }

    if (taxes !== undefined) bill.taxes = taxes;
    if (discount !== undefined) bill.discount = discount;

    // Recalculate total
    const additionalTotal = bill.additionalServices.reduce((sum, s) => sum + s.totalPrice, 0);
    bill.totalAmount = bill.roomCharges + additionalTotal + bill.taxes - bill.discount;

    await bill.save();

    const populatedBill = await Billing.findById(bill._id)
      .populate('reservationId')
      .populate('guestId', 'firstName lastName email');

    res.json({ success: true, bill: populatedBill });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Download invoice as PDF
// @route   GET /api/billing/:id/pdf
// @access  Private
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('reservationId')
      .populate('guestId', 'firstName lastName email phone address');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Guests can only download their own invoices
    if (req.user.role === 'guest' && bill.guestId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const reservation = await Reservation.findById(bill.reservationId._id).populate('roomId');
    if (!reservation || !reservation.roomId) {
      return res.status(404).json({ message: 'Reservation or room not found' });
    }

    const room = reservation.roomId;

    const { filepath, filename } = await pdfService.generateInvoicePDF(bill, bill.guestId, reservation, room);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading PDF:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error generating PDF' });
        }
      }
      // Clean up temp file
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          try {
            fs.unlinkSync(filepath);
          } catch (cleanupErr) {
            console.error('Error cleaning up temp file:', cleanupErr);
          }
        }
      }, 5000);
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

