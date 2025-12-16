const Feedback = require('../models/Feedback');

// @desc    Get all feedback (with filtering)
// @route   GET /api/feedback
// @access  Private
exports.getFeedbacks = async (req, res) => {
  try {
    const { category, rating, status, guestId } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (rating) query.rating = parseInt(rating);
    if (status) query.status = status;
    if (guestId) query.guestId = guestId;

    // Guests can only see their own feedback
    if (req.user.role === 'guest') {
      query.guestId = req.user._id;
    }

    const feedbacks = await Feedback.find(query)
      .populate('guestId', 'firstName lastName email')
      .populate('reservationId', 'confirmationNumber')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, count: feedbacks.length, feedbacks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get feedback statistics
// @route   GET /api/feedback/stats
// @access  Private (Admin, Manager)
exports.getFeedbackStats = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { status: 'approved' };
    if (category) query.category = category;

    const feedbacks = await Feedback.find(query);
    
    const total = feedbacks.length;
    const avgRating = total > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / total 
      : 0;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const categoryBreakdown = {};

    feedbacks.forEach(f => {
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
      categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalFeedbacks: total,
        averageRating: Math.round(avgRating * 100) / 100,
        ratingDistribution,
        categoryBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('guestId', 'firstName lastName email')
      .populate('reservationId');
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Guests can only view their own feedback
    if (req.user.role === 'guest' && feedback.guestId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Private
exports.createFeedback = async (req, res) => {
  try {
    const { reservationId, rating, category, comment, isAnonymous } = req.body;

    const feedback = await Feedback.create({
      guestId: req.user._id,
      reservationId,
      rating,
      category,
      comment,
      isAnonymous: isAnonymous || false
    });

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('guestId', 'firstName lastName email')
      .populate('reservationId', 'confirmationNumber');

    res.status(201).json({ success: true, feedback: populatedFeedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update feedback status (approve/reject)
// @route   PUT /api/feedback/:id/status
// @access  Private (Admin, Manager)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = req.body.status;
    await feedback.save();

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('guestId', 'firstName lastName email')
      .populate('reservationId', 'confirmationNumber');

    res.json({ success: true, feedback: populatedFeedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Guests can only delete their own feedback, admin/manager can delete any
    if (req.user.role === 'guest' && feedback.guestId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await feedback.deleteOne();
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


