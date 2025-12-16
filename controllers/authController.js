const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, address } = req.body;

    // Normalize email (lowercase and trim) for consistency
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    
    if (!normalizedEmail || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if user already exists (with normalized email)
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user with normalized email
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      role,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email (lowercase and trim) for consistency
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log('❌ Login attempt - User not found:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ Login attempt - User inactive:', normalizedEmail);
      return res.status(401).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    // Check if user has a password (for Google OAuth users without password)
    if (!user.password || user.password.startsWith('google-oauth-')) {
      console.log('❌ Login attempt - User has no password set:', normalizedEmail);
      return res.status(401).json({ message: 'Please use Google Sign-In for this account' });
    }

    // Check password
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
    } catch (compareError) {
      console.error('❌ Password comparison error:', compareError);
      return res.status(500).json({ message: 'Server error during authentication' });
    }
    
    if (!isMatch) {
      console.log('❌ Login attempt - Invalid password for:', normalizedEmail);
      console.log('   User exists:', !!user);
      console.log('   User has password:', !!user.password);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ Login successful for:', normalizedEmail, 'Role:', user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id, // Add _id for compatibility
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Google OAuth Login/Register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify Google token (we'll use google-auth-library)
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (picture) user.profilePicture = picture;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          firstName: firstName || 'User',
          lastName: lastName || '',
          email: email.toLowerCase(),
          googleId,
          role: 'guest', // Default role for Google sign-in
          password: 'google-oauth-' + Date.now(), // Dummy password, won't be used
          profilePicture: picture
        });
      }
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

