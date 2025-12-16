const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const billingController = require('../controllers/billingController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/billing
// @desc    Get all bills (with filtering)
// @access  Private
router.get('/', protect, billingController.getBills);

// IMPORTANT: More specific route must come before generic :id route
// @route   GET /api/billing/:id/pdf
// @desc    Download invoice as PDF
// @access  Private
router.get('/:id/pdf', protect, billingController.downloadInvoicePDF);

// @route   GET /api/billing/:id
// @desc    Get single bill/invoice
// @access  Private
router.get('/:id', protect, billingController.getBill);

// @route   POST /api/billing
// @desc    Create new bill/invoice
// @access  Private (Receptionist, Manager, Admin)
router.post('/', protect, authorize('receptionist', 'manager', 'admin'), [
  body('reservationId').notEmpty(),
  body('roomCharges').isFloat({ min: 0 }),
  body('totalAmount').isFloat({ min: 0 })
], validate, billingController.createBill);

// @route   PUT /api/billing/:id/payment
// @desc    Update payment status
// @access  Private (Receptionist, Manager, Admin)
router.put('/:id/payment', protect, authorize('receptionist', 'manager', 'admin'), [
  body('paymentStatus').isIn(['pending', 'partial', 'paid', 'refunded']),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'bank-transfer', 'other'])
], validate, billingController.updatePayment);

// @route   PUT /api/billing/:id
// @desc    Update bill
// @access  Private (Receptionist, Manager, Admin)
router.put('/:id', protect, authorize('receptionist', 'manager', 'admin'), billingController.updateBill);

module.exports = router;
