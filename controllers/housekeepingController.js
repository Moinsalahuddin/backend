const Housekeeping = require('../models/Housekeeping');
const Room = require('../models/Room');

// @desc    Get all housekeeping tasks (with filtering)
// @route   GET /api/housekeeping
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, taskType, assignedTo, roomId, priority } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (taskType) query.taskType = taskType;
    if (assignedTo) query.assignedTo = assignedTo;
    if (roomId) query.roomId = roomId;
    if (priority) query.priority = priority;

    // Housekeeping staff can only see their own tasks
    if (req.user.role === 'housekeeping') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Housekeeping.find(query)
      .populate('roomId', 'roomNumber roomType floor status')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ scheduledDate: 1 });
    
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single housekeeping task
// @route   GET /api/housekeeping/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Housekeeping.findById(req.params.id)
      .populate('roomId')
      .populate('assignedTo', 'firstName lastName email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new housekeeping task
// @route   POST /api/housekeeping
// @access  Private (Admin, Manager, Receptionist)
exports.createTask = async (req, res) => {
  try {
    const { roomId, taskType, scheduledDate, priority, notes, assignedTo } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const task = await Housekeeping.create({
      roomId,
      taskType,
      scheduledDate: new Date(scheduledDate),
      priority: priority || 'medium',
      notes,
      assignedTo
    });

    const populatedTask = await Housekeeping.findById(task._id)
      .populate('roomId', 'roomNumber roomType floor')
      .populate('assignedTo', 'firstName lastName email');

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update housekeeping task
// @route   PUT /api/housekeeping/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Housekeeping.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Housekeeping staff can only update status and notes for their own tasks
    if (req.user.role === 'housekeeping') {
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
      // Only allow status and notes updates
      if (req.body.status) task.status = req.body.status;
      if (req.body.notes) task.notes = req.body.notes;
      if (req.body.status === 'completed') {
        task.completedDate = new Date();
      }
    } else {
      // Admin/Manager can update all fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && key !== '_id') {
          task[key] = req.body[key];
        }
      });
      if (req.body.status === 'completed' && !task.completedDate) {
        task.completedDate = new Date();
      }
    }

    task.updatedAt = Date.now();
    await task.save();

    // Update room status if task is completed
    if (task.status === 'completed' && task.taskType === 'cleaning') {
      const room = await Room.findById(task.roomId);
      if (room && room.status === 'cleaning') {
        room.status = 'available';
        await room.save();
      }
    }

    const populatedTask = await Housekeeping.findById(task._id)
      .populate('roomId', 'roomNumber roomType floor status')
      .populate('assignedTo', 'firstName lastName email');

    res.json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete housekeeping task
// @route   DELETE /api/housekeeping/:id
// @access  Private (Admin, Manager)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Housekeeping.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

