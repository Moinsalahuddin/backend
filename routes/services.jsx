const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const serviceController = require('../controllers/serviceController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/services
// @desc    Get all service requests (with filtering)
// @access  Private
router.get('/', protect, serviceController.getRequests);

// @route   GET /api/services/:id
// @desc    Get single service request
// @access  Private
router.get('/:id', protect, serviceController.getRequest);

// @route   POST /api/services
// @desc    Create new service request
// @access  Private
router.post('/', protect, [
  body('reservationId').notEmpty(),
  body('serviceType').isIn(['room-service', 'wake-up-call', 'transportation', 'laundry', 'spa', 'concierge', 'other']),
  body('description').notEmpty().trim()
], validate, serviceController.createRequest);

// @route   PUT /api/services/:id
// @desc    Update service request
// @access  Private
router.put('/:id', protect, serviceController.updateRequest);

// @route   DELETE /api/services/:id
// @desc    Delete service request
// @access  Private
router.delete('/:id', protect, serviceController.deleteRequest);

module.exports = router;

