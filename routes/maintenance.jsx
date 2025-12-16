const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const maintenanceController = require('../controllers/maintenanceController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/maintenance
// @desc    Get all maintenance requests (with filtering)
// @access  Private
router.get('/', protect, maintenanceController.getRequests);

// @route   GET /api/maintenance/:id
// @desc    Get single maintenance request
// @access  Private
router.get('/:id', protect, maintenanceController.getRequest);

// @route   POST /api/maintenance
// @desc    Create new maintenance request
// @access  Private
router.post('/', protect, [
  body('roomId').notEmpty(),
  body('issueType').isIn(['plumbing', 'electrical', 'hvac', 'furniture', 'appliance', 'other']),
  body('description').notEmpty().trim()
], validate, maintenanceController.createRequest);

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance request
// @access  Private
router.put('/:id', protect, maintenanceController.updateRequest);

// @route   DELETE /api/maintenance/:id
// @desc    Delete maintenance request
// @access  Private (Admin, Manager)
router.delete('/:id', protect, maintenanceController.deleteRequest);

module.exports = router;

