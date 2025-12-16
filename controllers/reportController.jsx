const Reservation = require('../models/Reservation');
const Billing = require('../models/Billing');
const Room = require('../models/Room');
const Housekeeping = require('../models/Housekeeping');
const Maintenance = require('../models/Maintenance');

// @desc    Get occupancy rate report
// @route   GET /api/reports/occupancy
// @access  Private (Admin, Manager)
exports.getOccupancyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const totalRooms = await Room.countDocuments();
    const reservations = await Reservation.find({
      checkInDate: { $lte: end },
      checkOutDate: { $gte: start },
      status: { $in: ['confirmed', 'checked-in'] }
    });

    // Calculate occupancy for each day in range
    const occupancyData = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayReservations = reservations.filter(r => {
        return r.checkInDate <= currentDate && r.checkOutDate >= currentDate;
      });
      const occupancyRate = totalRooms > 0 ? (dayReservations.length / totalRooms) * 100 : 0;
      
      occupancyData.push({
        date: new Date(currentDate),
        occupiedRooms: dayReservations.length,
        totalRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const avgOccupancy = occupancyData.reduce((sum, d) => sum + d.occupancyRate, 0) / occupancyData.length;

    res.json({
      success: true,
      report: {
        period: { start, end },
        totalRooms,
        averageOccupancyRate: Math.round(avgOccupancy * 100) / 100,
        dailyData: occupancyData
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get revenue report
// @route   GET /api/reports/revenue
// @access  Private (Admin, Manager)
exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const bills = await Billing.find({
      issuedAt: { $gte: start, $lte: end },
      paymentStatus: 'paid'
    });

    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const roomRevenue = bills.reduce((sum, bill) => sum + bill.roomCharges, 0);
    const servicesRevenue = bills.reduce((sum, bill) => {
      return sum + bill.additionalServices.reduce((s, service) => s + service.totalPrice, 0);
    }, 0);
    const taxesCollected = bills.reduce((sum, bill) => sum + bill.taxes, 0);

    // Revenue by service type
    const serviceBreakdown = {};
    bills.forEach(bill => {
      bill.additionalServices.forEach(service => {
        if (!serviceBreakdown[service.serviceType]) {
          serviceBreakdown[service.serviceType] = 0;
        }
        serviceBreakdown[service.serviceType] += service.totalPrice;
      });
    });

    res.json({
      success: true,
      report: {
        period: { start, end },
        totalRevenue,
        roomRevenue,
        servicesRevenue,
        taxesCollected,
        totalBills: bills.length,
        serviceBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reservations report
// @route   GET /api/reports/reservations
// @access  Private (Admin, Manager)
exports.getReservationsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const reservations = await Reservation.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('roomId', 'roomType');

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      'checked-in': 0,
      'checked-out': 0,
      cancelled: 0
    };

    const roomTypeCounts = {};

    reservations.forEach(res => {
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      const roomType = res.roomId?.roomType || 'Unknown';
      roomTypeCounts[roomType] = (roomTypeCounts[roomType] || 0) + 1;
    });

    res.json({
      success: true,
      report: {
        period: { start, end },
        totalReservations: reservations.length,
        statusBreakdown: statusCounts,
        roomTypeBreakdown: roomTypeCounts
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Manager)
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's stats
    const todayCheckIns = await Reservation.countDocuments({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'checked-in'] }
    });

    const todayCheckOuts = await Reservation.countDocuments({
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['checked-in'] }
    });

    // Current occupancy
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Reservation.countDocuments({
      status: 'checked-in'
    });

    // Revenue today
    const todayBills = await Billing.find({
      issuedAt: { $gte: today, $lt: tomorrow },
      paymentStatus: 'paid'
    });
    const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

    // Pending tasks
    const pendingHousekeeping = await Housekeeping.countDocuments({ status: 'pending' });
    const pendingMaintenance = await Maintenance.countDocuments({ status: 'reported' });

    res.json({
      success: true,
      dashboard: {
        todayCheckIns,
        todayCheckOuts,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100 * 100) / 100 : 0,
        todayRevenue,
        pendingHousekeeping,
        pendingMaintenance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


