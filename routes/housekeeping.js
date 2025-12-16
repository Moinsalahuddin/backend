const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const housekeepingController = require('../controllers/housekeepingController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/housekeeping
// @desc    Get all housekeeping tasks (with filtering)
// @access  Private
router.get('/', protect, housekeepingController.getTasks);

// @route   GET /api/housekeeping/:id
// @desc    Get single housekeeping task
// @access  Private
router.get('/:id', protect, housekeepingController.getTask);

// @route   POST /api/housekeeping
// @desc    Create new housekeeping task
// @access  Private (Admin, Manager, Receptionist)
router.post('/', protect, authorize('admin', 'manager', 'receptionist'), [
  body('roomId').notEmpty(),
  body('taskType').isIn(['cleaning', 'maintenance', 'inspection', 'deep-cleaning']),
  body('scheduledDate').isISO8601()
], validate, housekeepingController.createTask);

// @route   PUT /api/housekeeping/:id
// @desc    Update housekeeping task
// @access  Private
router.put('/:id', protect, housekeepingController.updateTask);

// @route   DELETE /api/housekeeping/:id
// @desc    Delete housekeeping task
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), housekeepingController.deleteTask);

module.exports = router;
