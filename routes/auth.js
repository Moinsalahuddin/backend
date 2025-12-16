const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Invalid email format. Please use format: example@gmail.com')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim(),
  body('role')
    .isIn(['admin', 'manager', 'receptionist', 'housekeeping', 'guest'])
    .withMessage('Invalid role selected')
], validate, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Invalid email format. Please use format: example@gmail.com')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], validate, authController.login);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   POST /api/auth/google
// @desc    Google OAuth Login/Register
// @access  Public
router.post('/google', authController.googleAuth);

module.exports = router;
