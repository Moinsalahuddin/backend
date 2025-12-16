const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (with filtering)
// @access  Private (Admin, Manager)
router.get('/', protect, authorize('admin', 'manager'), userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private
router.get('/:id', protect, userController.getUser);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('admin', 'manager'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['admin', 'manager', 'receptionist', 'housekeeping', 'guest'])
], validate, userController.createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, [
  body('email').optional().isEmail().normalizeEmail(),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim()
], validate, userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete - set isActive to false)
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), userController.deleteUser);

module.exports = router;

