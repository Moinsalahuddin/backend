const Reservation = require('../models/Reservation');
const Room = require('../models/Room');

// @desc    Get all reservations (with filtering)
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res) => {
  try {
    const { status, guestId, roomId, checkInDate, checkOutDate } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (guestId) query.guestId = guestId;
    if (roomId) query.roomId = roomId;
    if (checkInDate) query.checkInDate = { $gte: new Date(checkInDate) };
    if (checkOutDate) query.checkOutDate = { $lte: new Date(checkOutDate) };

    // Guests can only see their own reservations
    if (req.user.role === 'guest') {
      query.guestId = req.user._id;
    }

    const reservations = await Reservation.find(query)
      .populate('guestId', 'firstName lastName email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, count: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('guestId', 'firstName lastName email phone address')
      .populate('roomId');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Guests can only view their own reservations
    if (req.user.role === 'guest' && reservation.guestId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new reservation
// @route   POST /api/reservations
// @access  Private
exports.createReservation = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests, bookingSource } = req.body;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (numberOfGuests > room.maxOccupancy) {
      return res.status(400).json({ message: `Room can only accommodate ${room.maxOccupancy} guests` });
    }

    // Check for conflicting reservations
    const conflictingReservation = await Reservation.findOne({
      roomId,
      status: { $in: ['confirmed', 'checked-in'] },
      $or: [
        { checkInDate: { $lt: checkOut, $gte: checkIn } },
        { checkOutDate: { $gt: checkIn, $lte: checkOut } },
        { checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } }
      ]
    });

    if (conflictingReservation) {
      return res.status(400).json({ message: 'Room is not available for the selected dates' });
    }

    // Calculate total amount
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = room.pricePerNight * nights;

    // Determine guestId - staff can create for any guest, guests create for themselves
    const guestId = req.user.role === 'guest' ? req.user._id : (req.body.guestId || req.user._id);

    const reservation = await Reservation.create({
      guestId,
      roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      totalAmount,
      specialRequests,
      bookingSource: bookingSource || 'online'
    });

    // Update room status to reserved
    room.status = 'reserved';
    await room.save();

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('guestId', 'firstName lastName email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight');

    res.status(201).json({ success: true, reservation: populatedReservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check-in guest
// @route   PUT /api/reservations/:id/checkin
// @access  Private (Receptionist, Manager, Admin)
exports.checkIn = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('roomId');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed reservations can be checked in' });
    }

    reservation.status = 'checked-in';
    reservation.updatedAt = Date.now();
    await reservation.save();

    // Update room status
    const room = await Room.findById(reservation.roomId._id);
    room.status = 'occupied';
    await room.save();

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('guestId', 'firstName lastName email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight');

    res.json({ success: true, reservation: populatedReservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check-out guest
// @route   PUT /api/reservations/:id/checkout
// @access  Private (Receptionist, Manager, Admin)
exports.checkOut = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('roomId');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'checked-in') {
      return res.status(400).json({ message: 'Only checked-in reservations can be checked out' });
    }

    reservation.status = 'checked-out';
    reservation.updatedAt = Date.now();
    await reservation.save();

    // Update room status
    const room = await Room.findById(reservation.roomId._id);
    room.status = 'cleaning';
    await room.save();

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('guestId', 'firstName lastName email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight');

    res.json({ success: true, reservation: populatedReservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res) => {
  try {
    let reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Guests can only cancel their own reservations
    if (req.user.role === 'guest') {
      if (reservation.guestId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      // Guests can only cancel
      if (req.body.status && req.body.status !== 'cancelled') {
        return res.status(403).json({ message: 'Guests can only cancel reservations' });
      }
    }

    // Update fields
    if (req.body.status) reservation.status = req.body.status;
    if (req.body.specialRequests) reservation.specialRequests = req.body.specialRequests;
    
    reservation.updatedAt = Date.now();
    await reservation.save();

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('guestId', 'firstName lastName email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight');

    res.json({ success: true, reservation: populatedReservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


