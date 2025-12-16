const express = require('express');
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, notificationController.getNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, notificationController.markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, notificationController.markAllAsRead);

module.exports = router;

