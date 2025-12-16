const Maintenance = require('../models/Maintenance');
const Room = require('../models/Room');

// @desc    Get all maintenance requests (with filtering)
// @route   GET /api/maintenance
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    const { status, issueType, roomId, priority, reportedBy } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (issueType) query.issueType = issueType;
    if (roomId) query.roomId = roomId;
    if (priority) query.priority = priority;
    if (reportedBy) query.reportedBy = reportedBy;

    // Guests can only see their own maintenance requests
    if (req.user.role === 'guest') {
      query.reportedBy = req.user._id;
    }

    const requests = await Maintenance.find(query)
      .populate('roomId', 'roomNumber roomType floor')
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ reportedAt: -1 });
    
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single maintenance request
// @route   GET /api/maintenance/:id
// @access  Private
exports.getRequest = async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id)
      .populate('roomId')
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Guests can only view their own requests
    if (req.user.role === 'guest' && request.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new maintenance request
// @route   POST /api/maintenance
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { roomId, issueType, description, priority } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const request = await Maintenance.create({
      roomId,
      reportedBy: req.user._id,
      issueType,
      description,
      priority: priority || 'medium'
    });

    // Update room status if urgent
    if (priority === 'urgent') {
      room.status = 'maintenance';
      await room.save();
    }

    const populatedRequest = await Maintenance.findById(request._id)
      .populate('roomId', 'roomNumber roomType floor')
      .populate('reportedBy', 'firstName lastName email');

    res.status(201).json({ success: true, request: populatedRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update maintenance request
// @route   PUT /api/maintenance/:id
// @access  Private
exports.updateRequest = async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Only admin/manager can assign and update status
    if (['assigned', 'in-progress', 'resolved', 'cancelled'].includes(req.body.status)) {
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Only admin/manager can update status' });
      }
    }

    // Update fields
    if (req.body.status) request.status = req.body.status;
    if (req.body.assignedTo) request.assignedTo = req.body.assignedTo;
    if (req.body.priority) request.priority = req.body.priority;
    if (req.body.estimatedCost !== undefined) request.estimatedCost = req.body.estimatedCost;
    if (req.body.actualCost !== undefined) request.actualCost = req.body.actualCost;
    if (req.body.notes) request.notes = req.body.notes;
    
    if (req.body.status === 'resolved') {
      request.resolvedAt = new Date();
      
      // Update room status back to available if it was in maintenance
      const room = await Room.findById(request.roomId);
      if (room && room.status === 'maintenance') {
        room.status = 'available';
        await room.save();
      }
    }

    await request.save();

    const populatedRequest = await Maintenance.findById(request._id)
      .populate('roomId', 'roomNumber roomType floor status')
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    res.json({ success: true, request: populatedRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete maintenance request
// @route   DELETE /api/maintenance/:id
// @access  Private (Admin, Manager)
exports.deleteRequest = async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    await request.deleteOne();
    res.json({ success: true, message: 'Maintenance request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


