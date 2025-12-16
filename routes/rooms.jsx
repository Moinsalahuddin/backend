const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const roomController = require('../controllers/roomController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms (with filtering)
// @access  Private
router.get('/', protect, roomController.getRooms);

// @route   GET /api/rooms/availability/check
// @desc    Check room availability
// @access  Private
router.get('/availability/check', protect, roomController.checkAvailability);

// @route   GET /api/rooms/:id
// @desc    Get single room
// @access  Private
router.get('/:id', protect, roomController.getRoom);

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('admin', 'manager'), [
  body('roomNumber').notEmpty().trim(),
  body('roomType').isIn(['Single', 'Double', 'Suite', 'Deluxe', 'Presidential']),
  body('floor').isInt({ min: 1 }),
  body('pricePerNight').isFloat({ min: 0 }),
  body('maxOccupancy').isInt({ min: 1 })
], validate, roomController.createRoom);

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin, Manager, Receptionist)
router.put('/:id', protect, authorize('admin', 'manager', 'receptionist'), roomController.updateRoom);

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), roomController.deleteRoom);

module.exports = router;

