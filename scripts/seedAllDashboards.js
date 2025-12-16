const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

// Import Models
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const Billing = require('../models/Billing');
const Housekeeping = require('../models/Housekeeping');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const ServiceRequest = require('../models/ServiceRequest');

async function seedAllDashboards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully\n');

    // ============================================
    // 1. CREATE USERS (ALL ROLES)
    // ============================================
    console.log('📝 Creating users...');
    
    const usersData = [
      // Admin
      { firstName: 'Admin', lastName: 'User', email: 'admin@luxurystay.com', password: 'Admin123', role: 'admin', phone: '+1234567890' },
      // Manager
      { firstName: 'Manager', lastName: 'Smith', email: 'manager@luxurystay.com', password: 'Manager123', role: 'manager', phone: '+1234567891' },
      // Receptionists
      { firstName: 'Sarah', lastName: 'Johnson', email: 'receptionist1@luxurystay.com', password: 'Recep123', role: 'receptionist', phone: '+1234567892' },
      { firstName: 'Michael', lastName: 'Brown', email: 'receptionist2@luxurystay.com', password: 'Recep123', role: 'receptionist', phone: '+1234567893' },
      // Housekeeping
      { firstName: 'Emma', lastName: 'Davis', email: 'housekeeping1@luxurystay.com', password: 'House123', role: 'housekeeping', phone: '+1234567894' },
      { firstName: 'James', lastName: 'Wilson', email: 'housekeeping2@luxurystay.com', password: 'House123', role: 'housekeeping', phone: '+1234567895' },
      { firstName: 'Olivia', lastName: 'Martinez', email: 'housekeeping3@luxurystay.com', password: 'House123', role: 'housekeeping', phone: '+1234567896' },
      // Guests
      { firstName: 'John', lastName: 'Doe', email: 'guest1@example.com', password: 'Guest123', role: 'guest', phone: '+1234567897' },
      { firstName: 'Jane', lastName: 'Smith', email: 'guest2@example.com', password: 'Guest123', role: 'guest', phone: '+1234567898' },
      { firstName: 'Robert', lastName: 'Williams', email: 'guest3@example.com', password: 'Guest123', role: 'guest', phone: '+1234567899' },
      { firstName: 'Emily', lastName: 'Jones', email: 'guest4@example.com', password: 'Guest123', role: 'guest', phone: '+1234567900' },
      { firstName: 'David', lastName: 'Brown', email: 'guest5@example.com', password: 'Guest123', role: 'guest', phone: '+1234567901' },
      { firstName: 'Lisa', lastName: 'Garcia', email: 'guest6@example.com', password: 'Guest123', role: 'guest', phone: '+1234567902' },
      { firstName: 'Michael', lastName: 'Miller', email: 'guest7@example.com', password: 'Guest123', role: 'guest', phone: '+1234567903' },
      { firstName: 'Amanda', lastName: 'Davis', email: 'guest8@example.com', password: 'Guest123', role: 'guest', phone: '+1234567904' },
    ];

    const createdUsers = {};
    for (const userData of usersData) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        createdUsers[userData.role] = createdUsers[userData.role] || [];
        createdUsers[userData.role].push(user);
        console.log(`   ✅ Created ${userData.role}: ${userData.firstName} ${userData.lastName}`);
      } else {
        createdUsers[userData.role] = createdUsers[userData.role] || [];
        createdUsers[userData.role].push(existingUser);
        console.log(`   ℹ️  ${userData.role} already exists: ${userData.firstName} ${userData.lastName}`);
      }
    }

    const adminUser = createdUsers['admin']?.[0] || await User.findOne({ role: 'admin' });
    const managerUser = createdUsers['manager']?.[0] || await User.findOne({ role: 'manager' });
    const receptionistUsers = createdUsers['receptionist'] || await User.find({ role: 'receptionist' });
    const housekeepingUsers = createdUsers['housekeeping'] || await User.find({ role: 'housekeeping' });
    const guestUsers = createdUsers['guest'] || await User.find({ role: 'guest' });

    console.log(`\n✅ Users created/verified: ${await User.countDocuments()} total\n`);

    // ============================================
    // 2. CREATE ROOMS
    // ============================================
    console.log('🏨 Creating rooms...');
    
    const existingRooms = await Room.countDocuments();
    if (existingRooms < 30) {
      const rooms = [];
      // Valid room types from Room model: 'Single', 'Double', 'Suite', 'Deluxe', 'Presidential'
      const roomTypes = ['Single', 'Double', 'Deluxe', 'Suite', 'Presidential'];
      const amenitiesMap = {
        'Single': ['WiFi', 'TV'],
        'Double': ['WiFi', 'TV', 'AC'],
        'Deluxe': ['WiFi', 'TV', 'AC', 'Mini Bar'],
        'Suite': ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Balcony'],
        'Presidential': ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Balcony', 'Butler Service']
      };
      const priceMap = { 'Single': 100, 'Double': 120, 'Deluxe': 150, 'Suite': 250, 'Presidential': 500 };
      const occupancyMap = { 'Single': 1, 'Double': 2, 'Deluxe': 2, 'Suite': 4, 'Presidential': 6 };

      for (let floor = 1; floor <= 10; floor++) {
        for (let room = 1; room <= 3; room++) {
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const roomNumber = `${floor}${String(room).padStart(2, '0')}`;
          
          rooms.push({
            roomNumber: roomNumber,
            roomType: roomType,
            floor: floor,
            pricePerNight: priceMap[roomType],
            status: 'available',
            maxOccupancy: occupancyMap[roomType],
            amenities: amenitiesMap[roomType]
          });
        }
      }

      await Room.insertMany(rooms);
      console.log(`   ✅ Created ${rooms.length} rooms`);
    } else {
      console.log(`   ℹ️  ${existingRooms} rooms already exist`);
    }

    const allRooms = await Room.find();
    console.log(`\n✅ Total rooms: ${allRooms.length}\n`);

    // ============================================
    // 3. CREATE RESERVATIONS (VARIOUS STATUSES)
    // ============================================
    console.log('📅 Creating reservations...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Today's check-ins (8 reservations)
    const todayCheckInCount = await Reservation.countDocuments({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'checked-in'] }
    });

    if (todayCheckInCount < 8) {
      const roomsForToday = allRooms.slice(0, 8);
      const todayReservations = [];
      
      for (let i = 0; i < roomsForToday.length; i++) {
        const room = roomsForToday[i];
        const nights = Math.floor(Math.random() * 3) + 1;
        const checkOut = new Date(today);
        checkOut.setDate(checkOut.getDate() + nights);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumber = 'LUX' + timestamp + random + i.toString().padStart(2, '0');
        
        todayReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: today,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(Number(room.maxOccupancy) || 2, Math.floor(Math.random() * 3) + 1),
          totalAmount: room.pricePerNight * nights,
          status: i < 5 ? 'checked-in' : 'confirmed',
          bookingSource: ['online', 'walk-in', 'phone', 'agent'][Math.floor(Math.random() * 4)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(todayReservations);
      console.log(`   ✅ Created ${todayReservations.length} reservations for today`);
    }

    // Today's check-outs (5 reservations)
    const todayCheckOutCount = await Reservation.countDocuments({
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: 'checked-in'
    });

    if (todayCheckOutCount < 5) {
      const roomsForCheckOut = allRooms.slice(8, 13);
      const checkOutReservations = [];
      
      for (let i = 0; i < roomsForCheckOut.length; i++) {
        const room = roomsForCheckOut[i];
        const checkIn = new Date(yesterday);
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 3));
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumber = 'LUX' + timestamp + random + (i + 100).toString().padStart(2, '0');
        
        const nights = Math.ceil((today - checkIn) / (1000 * 60 * 60 * 24));
        checkOutReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: today,
          numberOfGuests: Math.min(Number(room.maxOccupancy) || 2, Math.floor(Math.random() * 3) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'checked-in',
          bookingSource: ['online', 'walk-in'][Math.floor(Math.random() * 2)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(checkOutReservations);
      console.log(`   ✅ Created ${checkOutReservations.length} check-out reservations for today`);
    }

    // More checked-in reservations (for occupancy - 18 total)
    const checkedInCount = await Reservation.countDocuments({ status: 'checked-in' });
    if (checkedInCount < 18) {
      const needed = 18 - checkedInCount;
      const roomsForOccupancy = allRooms.slice(13, 13 + needed);
      const occupancyReservations = [];
      
      for (let i = 0; i < roomsForOccupancy.length; i++) {
        const room = roomsForOccupancy[i];
        const checkIn = new Date(yesterday);
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 5));
        const checkOut = new Date(today);
        checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 1);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumber = 'LUX' + timestamp + random + (i + 200).toString().padStart(2, '0');
        
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        occupancyReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(Number(room.maxOccupancy) || 2, Math.floor(Math.random() * 3) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'checked-in',
          bookingSource: ['online', 'walk-in', 'phone'][Math.floor(Math.random() * 3)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(occupancyReservations);
      console.log(`   ✅ Created ${occupancyReservations.length} additional checked-in reservations`);
    }

    // Past reservations (for history)
    const pastReservationsCount = await Reservation.countDocuments({
      checkOutDate: { $lt: today },
      status: 'checked-out'
    });

    if (pastReservationsCount < 20) {
      const roomsForPast = allRooms.slice(20, 30);
      const pastReservations = [];
      
      for (let i = 0; i < Math.min(roomsForPast.length, 20); i++) {
        const room = roomsForPast[i];
        const checkOut = new Date(yesterday);
        checkOut.setDate(checkOut.getDate() - Math.floor(Math.random() * 30));
        const checkIn = new Date(checkOut);
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 5) - 1);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumber = 'LUX' + timestamp + random + (i + 300).toString().padStart(2, '0');
        
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        pastReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(Number(room.maxOccupancy) || 2, Math.floor(Math.random() * 3) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'checked-out',
          bookingSource: ['online', 'walk-in', 'phone', 'agent'][Math.floor(Math.random() * 4)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(pastReservations);
      console.log(`   ✅ Created ${pastReservations.length} past reservations`);
    }

    // Future reservations
    const futureReservationsCount = await Reservation.countDocuments({
      checkInDate: { $gt: tomorrow }
    });

    if (futureReservationsCount < 15) {
      const roomsForFuture = allRooms.slice(15, 25);
      const futureReservations = [];
      
      for (let i = 0; i < Math.min(roomsForFuture.length, 15); i++) {
        const room = roomsForFuture[i];
        const checkIn = new Date(tomorrow);
        checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 14));
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 1);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumber = 'LUX' + timestamp + random + (i + 400).toString().padStart(2, '0');
        
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        futureReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(Number(room.maxOccupancy) || 2, Math.floor(Math.random() * 3) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'confirmed',
          bookingSource: ['online', 'phone', 'agent'][Math.floor(Math.random() * 3)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(futureReservations);
      console.log(`   ✅ Created ${futureReservations.length} future reservations`);
    }

    console.log(`\n✅ Total reservations: ${await Reservation.countDocuments()}\n`);

    // ============================================
    // 4. CREATE BILLING RECORDS
    // ============================================
    console.log('💰 Creating billing records...');
    
    const checkedInReservations = await Reservation.find({ status: 'checked-in' }).limit(15);
    const todayBillsCount = await Billing.countDocuments({
      issuedAt: { $gte: today, $lt: tomorrow },
      paymentStatus: 'paid'
    });

    if (todayBillsCount < 10 && checkedInReservations.length > 0) {
      const bills = [];
      
      for (let i = 0; i < Math.min(checkedInReservations.length, 10); i++) {
        const reservation = checkedInReservations[i];
        const room = await Room.findById(reservation.roomId);
        if (!room) continue;

        const roomCharges = reservation.totalAmount;
        const services = [
          { serviceName: 'Room Service', serviceType: 'food', quantity: Math.floor(Math.random() * 3) + 1, unitPrice: 25, totalPrice: 0 },
          { serviceName: 'Laundry Service', serviceType: 'laundry', quantity: Math.floor(Math.random() * 2) + 1, unitPrice: 15, totalPrice: 0 },
          { serviceName: 'Spa Service', serviceType: 'spa', quantity: 1, unitPrice: 50, totalPrice: 0 },
        ];
        services.forEach(s => s.totalPrice = s.quantity * s.unitPrice);
        
        const servicesTotal = services.reduce((sum, s) => sum + s.totalPrice, 0);
        const subtotal = roomCharges + servicesTotal;
        const taxes = subtotal * 0.1;
        const totalAmount = subtotal + taxes;

        const invoiceTimestamp = Date.now().toString().slice(-10);
        const invoiceRandom = Math.random().toString(36).substr(2, 3).toUpperCase();
        const invoiceNumber = 'INV' + invoiceTimestamp + invoiceRandom + i.toString().padStart(2, '0');
        
        bills.push({
          reservationId: reservation._id,
          guestId: reservation.guestId,
          roomCharges: roomCharges,
          additionalServices: services,
          taxes: taxes,
          totalAmount: totalAmount,
          paymentStatus: 'paid',
          paymentMethod: ['card', 'cash', 'upi', 'bank-transfer'][Math.floor(Math.random() * 4)],
          issuedAt: new Date(today.getTime() + Math.random() * (tomorrow.getTime() - today.getTime())),
          invoiceNumber: invoiceNumber
        });
      }

      await Billing.insertMany(bills);
      console.log(`   ✅ Created ${bills.length} billing records for today`);
    }

    // Past billing records
    const pastReservations = await Reservation.find({ status: 'checked-out' }).limit(20);
    const pastBillsCount = await Billing.countDocuments({
      issuedAt: { $lt: today }
    });

    if (pastBillsCount < 15 && pastReservations.length > 0) {
      const bills = [];
      
      for (let i = 0; i < Math.min(pastReservations.length, 15); i++) {
        const reservation = pastReservations[i];
        const room = await Room.findById(reservation.roomId);
        if (!room) continue;

        const roomCharges = reservation.totalAmount;
        const services = [
          { serviceName: 'Room Service', serviceType: 'food', quantity: Math.floor(Math.random() * 2) + 1, unitPrice: 25, totalPrice: 0 },
          { serviceName: 'Laundry Service', serviceType: 'laundry', quantity: Math.floor(Math.random() * 2) + 1, unitPrice: 15, totalPrice: 0 },
        ];
        services.forEach(s => s.totalPrice = s.quantity * s.unitPrice);
        
        const servicesTotal = services.reduce((sum, s) => sum + s.totalPrice, 0);
        const subtotal = roomCharges + servicesTotal;
        const taxes = subtotal * 0.1;
        const totalAmount = subtotal + taxes;

        const invoiceTimestamp = Date.now().toString().slice(-10);
        const invoiceRandom = Math.random().toString(36).substr(2, 3).toUpperCase();
        const invoiceNumber = 'INV' + invoiceTimestamp + invoiceRandom + (i + 100).toString().padStart(2, '0');
        
        const issuedDate = new Date(reservation.checkOutDate);
        issuedDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
        
        bills.push({
          reservationId: reservation._id,
          guestId: reservation.guestId,
          roomCharges: roomCharges,
          additionalServices: services,
          taxes: taxes,
          totalAmount: totalAmount,
          paymentStatus: 'paid',
          paymentMethod: ['card', 'cash', 'upi'][Math.floor(Math.random() * 3)],
          issuedAt: issuedDate,
          invoiceNumber: invoiceNumber
        });
      }

      await Billing.insertMany(bills);
      console.log(`   ✅ Created ${bills.length} past billing records`);
    }

    console.log(`\n✅ Total billing records: ${await Billing.countDocuments()}\n`);

    // ============================================
    // 5. CREATE HOUSEKEEPING TASKS
    // ============================================
    console.log('🧹 Creating housekeeping tasks...');
    
    const pendingHousekeepingCount = await Housekeeping.countDocuments({ status: 'pending' });
    if (pendingHousekeepingCount < 5) {
      const availableRooms = await Room.find({ status: { $in: ['available', 'cleaning'] } }).limit(5);
      const housekeepingTasks = [];
      
      for (const room of availableRooms) {
        const assignedUser = housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)];
        housekeepingTasks.push({
          roomId: room._id,
          assignedTo: assignedUser?._id || null,
          status: 'pending',
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          taskType: ['cleaning', 'maintenance', 'inspection', 'deep-cleaning'][Math.floor(Math.random() * 4)],
          notes: 'Room needs cleaning after checkout',
          scheduledDate: today
        });
      }

      await Housekeeping.insertMany(housekeepingTasks);
      console.log(`   ✅ Created ${housekeepingTasks.length} pending housekeeping tasks`);
    }

    // In-progress tasks
    const inProgressTasksCount = await Housekeeping.countDocuments({ status: 'in-progress' });
    if (inProgressTasksCount < 3) {
      const roomsForInProgress = await Room.find().limit(3);
      const inProgressTasks = [];
      
      for (const room of roomsForInProgress) {
        const assignedUser = housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)];
        inProgressTasks.push({
          roomId: room._id,
          assignedTo: assignedUser?._id || null,
          status: 'in-progress',
          priority: ['medium', 'high'][Math.floor(Math.random() * 2)],
          taskType: ['cleaning', 'deep-cleaning'][Math.floor(Math.random() * 2)],
          notes: 'Currently being cleaned',
          scheduledDate: today
        });
      }

      await Housekeeping.insertMany(inProgressTasks);
      console.log(`   ✅ Created ${inProgressTasks.length} in-progress housekeeping tasks`);
    }

    // Completed tasks (for history)
    const completedTasksCount = await Housekeeping.countDocuments({ status: 'completed' });
    if (completedTasksCount < 10) {
      const roomsForCompleted = await Room.find().limit(10);
      const completedTasks = [];
      
      for (const room of roomsForCompleted) {
        const assignedUser = housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)];
        const completedDate = new Date(yesterday);
        completedDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
        
        completedTasks.push({
          roomId: room._id,
          assignedTo: assignedUser?._id || null,
          status: 'completed',
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          taskType: ['cleaning', 'inspection'][Math.floor(Math.random() * 2)],
          notes: 'Task completed successfully',
          scheduledDate: yesterday,
          completedDate: completedDate
        });
      }

      await Housekeeping.insertMany(completedTasks);
      console.log(`   ✅ Created ${completedTasks.length} completed housekeeping tasks`);
    }

    console.log(`\n✅ Total housekeeping tasks: ${await Housekeeping.countDocuments()}\n`);

    // ============================================
    // 6. CREATE MAINTENANCE REQUESTS
    // ============================================
    console.log('🔧 Creating maintenance requests...');
    
    const pendingMaintenanceCount = await Maintenance.countDocuments({ status: 'reported' });
    if (pendingMaintenanceCount < 3) {
      const roomsForMaintenance = await Room.find().limit(3);
      const maintenanceRequests = [];
      
      for (const room of roomsForMaintenance) {
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        const issueTypes = ['plumbing', 'electrical', 'hvac', 'other'];
        const descriptions = [
          'AC not working properly',
          'Leaky faucet in bathroom',
          'Light bulb needs replacement',
          'Door lock not functioning',
          'TV remote not working',
          'WiFi connectivity issues'
        ];
        
        maintenanceRequests.push({
          roomId: room._id,
          reportedBy: guest._id,
          issueType: issueTypes[Math.floor(Math.random() * issueTypes.length)],
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          status: 'reported',
          reportedAt: new Date(today.getTime() - Math.random() * 24 * 60 * 60 * 1000)
        });
      }

      await Maintenance.insertMany(maintenanceRequests);
      console.log(`   ✅ Created ${maintenanceRequests.length} pending maintenance requests`);
    }

    // In-progress maintenance
    const inProgressMaintenanceCount = await Maintenance.countDocuments({ status: 'in-progress' });
    if (inProgressMaintenanceCount < 2) {
      const roomsForInProgress = await Room.find().limit(2);
      const inProgressMaintenance = [];
      
      for (const room of roomsForInProgress) {
        const assignedUser = housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)];
        inProgressMaintenance.push({
          roomId: room._id,
          reportedBy: guestUsers[Math.floor(Math.random() * guestUsers.length)]._id,
          assignedTo: assignedUser?._id || null,
          issueType: ['plumbing', 'electrical'][Math.floor(Math.random() * 2)],
          description: 'Maintenance work in progress',
          priority: 'high',
          status: 'in-progress',
          reportedAt: yesterday
        });
      }

      await Maintenance.insertMany(inProgressMaintenance);
      console.log(`   ✅ Created ${inProgressMaintenance.length} in-progress maintenance requests`);
    }

    // Resolved maintenance
    const resolvedMaintenanceCount = await Maintenance.countDocuments({ status: 'resolved' });
    if (resolvedMaintenanceCount < 8) {
      const roomsForResolved = await Room.find().limit(8);
      const resolvedMaintenance = [];
      
      for (const room of roomsForResolved) {
        const assignedUser = housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)];
        const resolvedDate = new Date(yesterday);
        resolvedDate.setHours(14 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60));
        
        resolvedMaintenance.push({
          roomId: room._id,
          reportedBy: guestUsers[Math.floor(Math.random() * guestUsers.length)]._id,
          assignedTo: assignedUser?._id || null,
          issueType: ['plumbing', 'electrical', 'hvac'][Math.floor(Math.random() * 3)],
          description: 'Issue has been resolved',
          priority: ['low', 'medium'][Math.floor(Math.random() * 2)],
          status: 'resolved',
          resolvedAt: resolvedDate,
          reportedAt: new Date(resolvedDate.getTime() - Math.random() * 48 * 60 * 60 * 1000)
        });
      }

      await Maintenance.insertMany(resolvedMaintenance);
      console.log(`   ✅ Created ${resolvedMaintenance.length} resolved maintenance requests`);
    }

    console.log(`\n✅ Total maintenance requests: ${await Maintenance.countDocuments()}\n`);

    // ============================================
    // 7. CREATE FEEDBACK
    // ============================================
    console.log('💬 Creating feedback...');
    
    const feedbackCount = await Feedback.countDocuments();
    if (feedbackCount < 15) {
      const checkedOutReservations = await Reservation.find({ status: 'checked-out' }).limit(15);
      const feedbacks = [];
      
      const categories = ['room', 'service', 'food', 'cleanliness', 'staff', 'overall'];
      const comments = [
        'Excellent stay! Very comfortable room.',
        'Great service from the staff.',
        'Room was clean and well-maintained.',
        'Food quality was outstanding.',
        'Would definitely recommend to others.',
        'Beautiful hotel with amazing amenities.',
        'Staff was very helpful and friendly.',
        'Room had a great view.',
        'Breakfast was delicious.',
        'Very satisfied with the overall experience.'
      ];
      
      for (let i = 0; i < Math.min(checkedOutReservations.length, 15); i++) {
        const reservation = checkedOutReservations[i];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
        
        feedbacks.push({
          guestId: reservation.guestId,
          reservationId: reservation._id,
          rating: rating,
          category: category,
          comment: comments[Math.floor(Math.random() * comments.length)],
          isAnonymous: Math.random() > 0.7,
          status: ['pending', 'approved'][Math.floor(Math.random() * 2)],
          createdAt: new Date(reservation.checkOutDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }

      await Feedback.insertMany(feedbacks);
      console.log(`   ✅ Created ${feedbacks.length} feedback entries`);
    }

    console.log(`\n✅ Total feedback: ${await Feedback.countDocuments()}\n`);

    // ============================================
    // 8. CREATE SERVICE REQUESTS
    // ============================================
    console.log('🛎️ Creating service requests...');
    
    const serviceRequestCount = await ServiceRequest.countDocuments();
    if (serviceRequestCount < 12) {
      const activeReservations = await Reservation.find({ status: 'checked-in' }).limit(12);
      const serviceRequests = [];
      
      const serviceTypes = ['room-service', 'wake-up-call', 'transportation', 'laundry', 'spa', 'concierge'];
      const descriptions = [
        'Breakfast for 2 people',
        'Wake up call at 7 AM',
        'Airport pickup needed',
        'Laundry service required',
        'Spa appointment booking',
        'Restaurant reservation',
        'Late checkout request',
        'Extra towels needed'
      ];
      
      for (let i = 0; i < Math.min(activeReservations.length, 12); i++) {
        const reservation = activeReservations[i];
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        const statuses = ['pending', 'confirmed', 'in-progress', 'completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        serviceRequests.push({
          guestId: reservation.guestId,
          reservationId: reservation._id,
          serviceType: serviceType,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          scheduledTime: serviceType === 'wake-up-call' ? new Date(today.getTime() + 7 * 60 * 60 * 1000) : null,
          status: status,
          assignedTo: status !== 'pending' ? receptionistUsers[Math.floor(Math.random() * receptionistUsers.length)]?._id : null,
          cost: serviceType === 'spa' ? 50 : serviceType === 'transportation' ? 30 : serviceType === 'laundry' ? 15 : 0,
          createdAt: new Date(today.getTime() - Math.random() * 24 * 60 * 60 * 1000)
        });
      }

      await ServiceRequest.insertMany(serviceRequests);
      console.log(`   ✅ Created ${serviceRequests.length} service requests`);
    }

    console.log(`\n✅ Total service requests: ${await ServiceRequest.countDocuments()}\n`);

    // ============================================
    // 9. UPDATE ROOM STATUSES
    // ============================================
    console.log('🔄 Updating room statuses...');
    
    const checkedInReservationsForRooms = await Reservation.find({ status: 'checked-in' }).distinct('roomId');
    await Room.updateMany(
      { _id: { $in: checkedInReservationsForRooms } },
      { status: 'occupied' }
    );
    console.log(`   ✅ Updated ${checkedInReservationsForRooms.length} rooms to occupied status`);

    const reservedRooms = await Reservation.find({ status: 'confirmed' }).distinct('roomId');
    await Room.updateMany(
      { _id: { $in: reservedRooms } },
      { status: 'reserved' }
    );
    console.log(`   ✅ Updated ${reservedRooms.length} rooms to reserved status`);

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL DASHBOARDS DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`   👥 Users: ${await User.countDocuments()}`);
    console.log(`   🏨 Rooms: ${await Room.countDocuments()}`);
    console.log(`   📅 Reservations: ${await Reservation.countDocuments()}`);
    console.log(`   💰 Billing Records: ${await Billing.countDocuments()}`);
    console.log(`   🧹 Housekeeping Tasks: ${await Housekeeping.countDocuments()}`);
    console.log(`   🔧 Maintenance Requests: ${await Maintenance.countDocuments()}`);
    console.log(`   💬 Feedback: ${await Feedback.countDocuments()}`);
    console.log(`   🛎️ Service Requests: ${await ServiceRequest.countDocuments()}`);
    console.log('\n🎉 All dashboards are now populated with data!');
    console.log('='.repeat(50) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding dashboard data:');
    console.error('   Message:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedAllDashboards();

