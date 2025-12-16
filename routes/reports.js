const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

// @route   GET /api/reports/occupancy
// @desc    Get occupancy rate report
// @access  Private (Admin, Manager)
router.get('/occupancy', protect, authorize('admin', 'manager'), reportController.getOccupancyReport);

// @route   GET /api/reports/revenue
// @desc    Get revenue report
// @access  Private (Admin, Manager)
router.get('/revenue', protect, authorize('admin', 'manager'), reportController.getRevenueReport);

// @route   GET /api/reports/reservations
// @desc    Get reservations report
// @access  Private (Admin, Manager)
router.get('/reservations', protect, authorize('admin', 'manager'), reportController.getReservationsReport);

// @route   GET /api/reports/dashboard
// @desc    Get dashboard summary
// @access  Private (Admin, Manager, Receptionist)
router.get('/dashboard', protect, authorize('admin', 'manager', 'receptionist'), reportController.getDashboard);

module.exports = router;
