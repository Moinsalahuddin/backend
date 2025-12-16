const Room = require('../models/Room');
const Reservation = require('../models/Reservation');

// @desc    Get all rooms (with filtering)
// @route   GET /api/rooms
// @access  Private
exports.getRooms = async (req, res) => {
  try {
    const { status, roomType, floor, minPrice, maxPrice } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (roomType) query.roomType = roomType;
    if (floor) query.floor = parseInt(floor);
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerNight.$lte = parseFloat(maxPrice);
    }

    const rooms = await Room.find(query).sort({ roomNumber: 1 });
    res.json({ success: true, count: rooms.length, rooms });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private (Admin, Manager)
exports.createRoom = async (req, res) => {
  try {
    const roomExists = await Room.findOne({ roomNumber: req.body.roomNumber });
    if (roomExists) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = await Room.create(req.body);
    res.status(201).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private (Admin, Manager, Receptionist)
exports.updateRoom = async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Receptionist can only update status
    if (req.user.role === 'receptionist' && Object.keys(req.body).some(key => key !== 'status')) {
      return res.status(403).json({ message: 'Receptionist can only update room status' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        room[key] = req.body[key];
      }
    });
    
    room.updatedAt = Date.now();
    await room.save();

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin, Manager)
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.deleteOne();
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check room availability
// @route   GET /api/rooms/availability/check
// @access  Private
exports.checkAvailability = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, roomType, maxOccupancy } = req.query;
    
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Find rooms that are available or not conflicting with reservations
    const query = { status: 'available' };
    if (roomType) query.roomType = roomType;
    if (maxOccupancy) query.maxOccupancy = { $gte: parseInt(maxOccupancy) };

    const allRooms = await Room.find(query);
    
    // Find conflicting reservations
    const conflictingReservations = await Reservation.find({
      status: { $in: ['confirmed', 'checked-in'] },
      $or: [
        { checkInDate: { $lt: checkOut, $gte: checkIn } },
        { checkOutDate: { $gt: checkIn, $lte: checkOut } },
        { checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } }
      ]
    });

    const conflictingRoomIds = conflictingReservations.map(r => r.roomId.toString());
    const availableRooms = allRooms.filter(room => !conflictingRoomIds.includes(room._id.toString()));

    res.json({ 
      success: true, 
      count: availableRooms.length, 
      rooms: availableRooms,
      checkInDate: checkIn,
      checkOutDate: checkOut
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


