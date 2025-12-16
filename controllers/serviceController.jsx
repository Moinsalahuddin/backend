const ServiceRequest = require('../models/ServiceRequest');
const Reservation = require('../models/Reservation');

// @desc    Get all service requests (with filtering)
// @route   GET /api/services
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    const { status, serviceType, guestId, reservationId } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (guestId) query.guestId = guestId;
    if (reservationId) query.reservationId = reservationId;

    // Guests can only see their own service requests
    if (req.user.role === 'guest') {
      query.guestId = req.user._id;
    }

    const requests = await ServiceRequest.find(query)
      .populate('guestId', 'firstName lastName email phone')
      .populate('reservationId', 'confirmationNumber checkInDate checkOutDate')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single service request
// @route   GET /api/services/:id
// @access  Private
exports.getRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('guestId', 'firstName lastName email phone')
      .populate('reservationId')
      .populate('assignedTo', 'firstName lastName email');
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Guests can only view their own requests
    if (req.user.role === 'guest' && request.guestId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new service request
// @route   POST /api/services
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { reservationId, serviceType, description, scheduledTime, cost } = req.body;

    // Verify reservation belongs to guest (if guest is making request)
    if (req.user.role === 'guest') {
      const reservation = await Reservation.findById(reservationId);
      if (!reservation || reservation.guestId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Reservation not found or not authorized' });
      }
    }

    const request = await ServiceRequest.create({
      guestId: req.user.role === 'guest' ? req.user._id : req.body.guestId || req.user._id,
      reservationId,
      serviceType,
      description,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      cost: cost || 0
    });

    const populatedRequest = await ServiceRequest.findById(request._id)
      .populate('guestId', 'firstName lastName email phone')
      .populate('reservationId', 'confirmationNumber');

    res.status(201).json({ success: true, request: populatedRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update service request
// @route   PUT /api/services/:id
// @access  Private
exports.updateRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Guests can only cancel their own requests
    if (req.user.role === 'guest') {
      if (request.guestId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      // Guests can only cancel
      if (req.body.status && req.body.status !== 'cancelled') {
        return res.status(403).json({ message: 'Guests can only cancel service requests' });
      }
    }

    // Update fields
    if (req.body.status) request.status = req.body.status;
    if (req.body.assignedTo && ['admin', 'manager', 'receptionist'].includes(req.user.role)) {
      request.assignedTo = req.body.assignedTo;
    }
    if (req.body.scheduledTime) request.scheduledTime = new Date(req.body.scheduledTime);
    if (req.body.cost !== undefined && ['admin', 'manager', 'receptionist'].includes(req.user.role)) {
      request.cost = req.body.cost;
    }
    if (req.body.description) request.description = req.body.description;
    
    request.updatedAt = Date.now();
    await request.save();

    const populatedRequest = await ServiceRequest.findById(request._id)
      .populate('guestId', 'firstName lastName email phone')
      .populate('reservationId', 'confirmationNumber')
      .populate('assignedTo', 'firstName lastName email');

    res.json({ success: true, request: populatedRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete service request
// @route   DELETE /api/services/:id
// @access  Private
exports.deleteRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Guests can only delete their own requests, staff can delete any
    if (req.user.role === 'guest' && request.guestId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await request.deleteOne();
    res.json({ success: true, message: 'Service request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


