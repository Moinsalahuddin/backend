const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/feedback
// @desc    Get all feedback (with filtering)
// @access  Private
router.get('/', protect, feedbackController.getFeedbacks);

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics
// @access  Private (Admin, Manager)
router.get('/stats', protect, authorize('admin', 'manager'), feedbackController.getFeedbackStats);

// @route   GET /api/feedback/:id
// @desc    Get single feedback
// @access  Private
router.get('/:id', protect, feedbackController.getFeedback);

// @route   POST /api/feedback
// @desc    Create new feedback
// @access  Private
router.post('/', protect, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('category').isIn(['room', 'service', 'food', 'cleanliness', 'staff', 'overall'])
], validate, feedbackController.createFeedback);

// @route   PUT /api/feedback/:id/status
// @desc    Update feedback status (approve/reject)
// @access  Private (Admin, Manager)
router.put('/:id/status', protect, authorize('admin', 'manager'), [
  body('status').isIn(['pending', 'approved', 'rejected'])
], validate, feedbackController.updateFeedbackStatus);

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private
router.delete('/:id', protect, feedbackController.deleteFeedback);

module.exports = router;

