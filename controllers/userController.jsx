const User = require('../models/User');

// @desc    Get all users (with filtering)
// @route   GET /api/users
// @access  Private (Admin, Manager)
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only view their own profile unless they are admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin, Manager)
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, address, preferences } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      address,
      preferences
    });

    res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only update their own profile unless they are admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only admin/manager can change role and isActive
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      delete req.body.role;
      delete req.body.isActive;
    }

    const { firstName, lastName, email, phone, address, preferences, role, isActive } = req.body;
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (preferences) user.preferences = preferences;
    if (role && (req.user.role === 'admin' || req.user.role === 'manager')) user.role = role;
    if (isActive !== undefined && (req.user.role === 'admin' || req.user.role === 'manager')) user.isActive = isActive;
    
    user.updatedAt = Date.now();
    await user.save();

    res.json({ success: true, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user (soft delete - set isActive to false)
// @route   DELETE /api/users/:id
// @access  Private (Admin, Manager)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    user.updatedAt = Date.now();
    await user.save();

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


