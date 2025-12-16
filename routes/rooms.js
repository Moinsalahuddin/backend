const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const roomController = require('../controllers/roomController');
const { validate } = require('../middleware/validate');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary (only if credentials are provided)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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
router.post('/', protect, authorize('admin', 'manager'), upload.array('images', 5), [
  body('roomNumber').notEmpty().trim(),
  body('roomType').isIn(['Single', 'Double', 'Suite', 'Deluxe', 'Presidential']),
  body('floor').isInt({ min: 1 }),
  body('pricePerNight').isFloat({ min: 0 }),
  body('maxOccupancy').isInt({ min: 1 })
], validate, roomController.createRoom);

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin, Manager, Receptionist)
router.put('/:id', protect, authorize('admin', 'manager', 'receptionist'), upload.array('images', 5), roomController.updateRoom);

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), roomController.deleteRoom);

module.exports = router;
