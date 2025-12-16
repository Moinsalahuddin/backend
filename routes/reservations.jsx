const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const reservationController = require('../controllers/reservationController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/reservations
// @desc    Get all reservations (with filtering)
// @access  Private
router.get('/', protect, reservationController.getReservations);

// @route   GET /api/reservations/:id
// @desc    Get single reservation
// @access  Private
router.get('/:id', protect, reservationController.getReservation);

// @route   POST /api/reservations
// @desc    Create new reservation
// @access  Private
router.post('/', protect, [
  body('roomId').notEmpty(),
  body('checkInDate').isISO8601(),
  body('checkOutDate').isISO8601(),
  body('numberOfGuests').isInt({ min: 1 })
], validate, reservationController.createReservation);

// @route   PUT /api/reservations/:id/checkin
// @desc    Check-in guest
// @access  Private (Receptionist, Manager, Admin)
router.put('/:id/checkin', protect, authorize('receptionist', 'manager', 'admin'), reservationController.checkIn);

// @route   PUT /api/reservations/:id/checkout
// @desc    Check-out guest
// @access  Private (Receptionist, Manager, Admin)
router.put('/:id/checkout', protect, authorize('receptionist', 'manager', 'admin'), reservationController.checkOut);

// @route   PUT /api/reservations/:id
// @desc    Update reservation
// @access  Private
router.put('/:id', protect, reservationController.updateReservation);

module.exports = router;

