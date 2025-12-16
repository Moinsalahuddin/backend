const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private (Admin, Manager)
router.get('/', protect, authorize('admin', 'manager'), settingsController.getSettings);

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (Admin only)
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;

