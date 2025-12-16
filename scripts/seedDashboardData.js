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

async function seedDashboardData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');

    // Get or create a guest user for reservations
    let guestUser = await User.findOne({ role: 'guest' });
    if (!guestUser) {
      guestUser = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'guest@example.com',
        password: 'Guest123',
        role: 'guest',
        phone: '+1234567890',
        isActive: true
      });
      console.log('✅ Created guest user for reservations');
    }

    // 1. Create Sample Rooms
    const existingRooms = await Room.countDocuments();
    if (existingRooms === 0) {
      const rooms = [
        { roomNumber: '101', roomType: 'Deluxe', floor: 1, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '102', roomType: 'Deluxe', floor: 1, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '103', roomType: 'Standard', floor: 1, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '104', roomType: 'Standard', floor: 1, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '201', roomType: 'Suite', floor: 2, pricePerNight: 250, status: 'available', maxOccupancy: 4, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
        { roomNumber: '202', roomType: 'Suite', floor: 2, pricePerNight: 250, status: 'available', maxOccupancy: 4, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
        { roomNumber: '301', roomType: 'Presidential', floor: 3, pricePerNight: 500, status: 'available', maxOccupancy: 6, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi'] },
        { roomNumber: '302', roomType: 'Presidential', floor: 3, pricePerNight: 500, status: 'available', maxOccupancy: 6, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi'] },
        { roomNumber: '401', roomType: 'Deluxe', floor: 4, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '402', roomType: 'Deluxe', floor: 4, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '501', roomType: 'Standard', floor: 5, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '502', roomType: 'Standard', floor: 5, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '601', roomType: 'Suite', floor: 6, pricePerNight: 250, status: 'available', maxOccupancy: 4, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
        { roomNumber: '602', roomType: 'Suite', floor: 6, pricePerNight: 250, status: 'available', maxOccupancy: 4, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
        { roomNumber: '701', roomType: 'Deluxe', floor: 7, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '702', roomType: 'Deluxe', floor: 7, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '801', roomType: 'Standard', floor: 8, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '802', roomType: 'Standard', floor: 8, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '901', roomType: 'Suite', floor: 9, pricePerNight: 250, status: 'available', maxOccupancy: 4, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
        { roomNumber: '902', roomType: 'Presidential', floor: 9, pricePerNight: 500, status: 'available', maxOccupancy: 6, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi'] },
        { roomNumber: '1001', roomType: 'Deluxe', floor: 10, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '1002', roomType: 'Deluxe', floor: 10, pricePerNight: 150, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV', 'AC'] },
        { roomNumber: '1101', roomType: 'Standard', floor: 11, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '1102', roomType: 'Standard', floor: 11, pricePerNight: 100, status: 'available', maxOccupancy: 2, amenities: ['WiFi', 'TV'] },
        { roomNumber: '1201', roomType: 'Suite', floor: 12, pricePerNight: 250, status: 'available', maxOccupancy: 4, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
      ];

      const createdRooms = await Room.insertMany(rooms);
      console.log(`✅ Created ${createdRooms.length} rooms`);
    } else {
      console.log(`ℹ️  ${existingRooms} rooms already exist`);
    }

    // 2. Create Sample Reservations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const allRooms = await Room.find();
    if (allRooms.length === 0) {
      console.log('❌ No rooms found. Please create rooms first.');
      process.exit(1);
    }

    // Check-in today reservations
    const todayCheckInCount = await Reservation.countDocuments({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'checked-in'] }
    });

    if (todayCheckInCount < 8) {
      const roomsForToday = allRooms.slice(0, 8);
      const todayReservations = [];
      
      for (let i = 0; i < roomsForToday.length; i++) {
        const room = roomsForToday[i];
        const nights = Math.floor(Math.random() * 3) + 1; // 1-3 nights
        const checkOut = new Date(today);
        checkOut.setDate(checkOut.getDate() + nights);
        
        // Ensure maxOccupancy is a valid number
        const maxOccupancy = Number(room.maxOccupancy) || 2;
        const numGuests = Math.min(maxOccupancy, Math.floor(Math.random() * 3) + 1);
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumber = 'LUX' + timestamp + random + i.toString().padStart(2, '0');
        
        todayReservations.push({
          guestId: guestUser._id,
          roomId: room._id,
          checkInDate: today,
          checkOutDate: checkOut,
          numberOfGuests: numGuests,
          totalAmount: room.pricePerNight * nights,
          status: i < 5 ? 'checked-in' : 'confirmed', // 5 checked-in, 3 confirmed
          bookingSource: ['online', 'walk-in', 'phone'][Math.floor(Math.random() * 3)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(todayReservations);
      console.log(`✅ Created ${todayReservations.length} reservations for today`);
    }

    // Check-out today reservations
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
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 3)); // 1-3 days ago
        
        // Ensure maxOccupancy is a valid number
        const maxOccupancy = Number(room.maxOccupancy) || 2;
        const numGuestsCheckOut = Math.min(maxOccupancy, Math.floor(Math.random() * 3) + 1);
        const timestampCheckOut = Date.now().toString().slice(-8);
        const randomCheckOut = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumberCheckOut = 'LUX' + timestampCheckOut + randomCheckOut + (i + 100).toString().padStart(2, '0');
        
        checkOutReservations.push({
          guestId: guestUser._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: today,
          numberOfGuests: numGuestsCheckOut,
          totalAmount: room.pricePerNight * Math.ceil((today - checkIn) / (1000 * 60 * 60 * 24)),
          status: 'checked-in',
          bookingSource: ['online', 'walk-in'][Math.floor(Math.random() * 2)],
          confirmationNumber: confirmationNumberCheckOut
        });
      }

      await Reservation.insertMany(checkOutReservations);
      console.log(`✅ Created ${checkOutReservations.length} check-out reservations for today`);
    }

    // More checked-in reservations (for occupancy)
    const checkedInCount = await Reservation.countDocuments({ status: 'checked-in' });
    if (checkedInCount < 18) {
      const roomsForOccupancy = allRooms.slice(13, 18);
      const occupancyReservations = [];
      
      for (let i = 0; i < roomsForOccupancy.length; i++) {
        const room = roomsForOccupancy[i];
        const checkIn = new Date(yesterday);
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 5)); // 1-5 days ago
        const checkOut = new Date(today);
        checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 days from now
        
        // Ensure maxOccupancy is a valid number
        const maxOccupancy = Number(room.maxOccupancy) || 2;
        const numGuestsOccupancy = Math.min(maxOccupancy, Math.floor(Math.random() * 3) + 1);
        const timestampOccupancy = Date.now().toString().slice(-8);
        const randomOccupancy = Math.random().toString(36).substr(2, 4).toUpperCase();
        const confirmationNumberOccupancy = 'LUX' + timestampOccupancy + randomOccupancy + (i + 200).toString().padStart(2, '0');
        
        occupancyReservations.push({
          guestId: guestUser._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: numGuestsOccupancy,
          totalAmount: room.pricePerNight * Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)),
          status: 'checked-in',
          bookingSource: ['online', 'walk-in', 'phone'][Math.floor(Math.random() * 3)],
          confirmationNumber: confirmationNumberOccupancy
        });
      }

      await Reservation.insertMany(occupancyReservations);
      console.log(`✅ Created ${occupancyReservations.length} additional checked-in reservations`);
    }

    // 3. Create Sample Billing Records (for today's revenue)
    const todayBillsCount = await Billing.countDocuments({
      issuedAt: { $gte: today, $lt: tomorrow },
      paymentStatus: 'paid'
    });

    if (todayBillsCount < 10) {
      const checkedInReservations = await Reservation.find({ status: 'checked-in' }).limit(10);
      const bills = [];
      
      for (const reservation of checkedInReservations) {
        const room = await Room.findById(reservation.roomId);
        if (!room) continue;

        const roomCharges = reservation.totalAmount;
        const services = [
          { serviceName: 'Room Service', serviceType: 'food', quantity: Math.floor(Math.random() * 3) + 1, unitPrice: 25, totalPrice: 0 },
          { serviceName: 'Laundry Service', serviceType: 'laundry', quantity: Math.floor(Math.random() * 2) + 1, unitPrice: 15, totalPrice: 0 },
        ];
        services.forEach(s => s.totalPrice = s.quantity * s.unitPrice);
        
        const servicesTotal = services.reduce((sum, s) => sum + s.totalPrice, 0);
        const subtotal = roomCharges + servicesTotal;
        const taxes = subtotal * 0.1; // 10% tax
        const totalAmount = subtotal + taxes;

        // Generate unique invoice number manually (since insertMany doesn't run pre-save hooks)
        const invoiceTimestamp = Date.now().toString().slice(-10);
        const invoiceRandom = Math.random().toString(36).substr(2, 3).toUpperCase();
        const invoiceNumber = 'INV' + invoiceTimestamp + invoiceRandom + bills.length.toString().padStart(2, '0');
        
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
      console.log(`✅ Created ${bills.length} billing records for today`);
    }

    // 4. Create Sample Housekeeping Tasks
    const pendingHousekeepingCount = await Housekeeping.countDocuments({ status: 'pending' });
    if (pendingHousekeepingCount < 3) {
      const availableRooms = await Room.find({ status: { $in: ['available', 'occupied'] } }).limit(3);
      const housekeepingTasks = availableRooms.map(room => ({
        roomId: room._id,
        assignedTo: null,
        status: 'pending',
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        taskType: ['cleaning', 'maintenance', 'inspection'][Math.floor(Math.random() * 3)],
        notes: 'Room needs cleaning after checkout',
        scheduledDate: today
      }));

      await Housekeeping.insertMany(housekeepingTasks);
      console.log(`✅ Created ${housekeepingTasks.length} pending housekeeping tasks`);
    }

    // 5. Create Sample Maintenance Requests
    const pendingMaintenanceCount = await Maintenance.countDocuments({ status: 'reported' });
    if (pendingMaintenanceCount < 2) {
      const roomsForMaintenance = await Room.find().limit(2);
      const maintenanceRequests = roomsForMaintenance.map(room => ({
        roomId: room._id,
        reportedBy: guestUser._id,
        issueType: ['plumbing', 'electrical', 'hvac', 'other'][Math.floor(Math.random() * 4)],
        description: ['AC not working', 'Leaky faucet', 'Light bulb needs replacement', 'Door lock issue'][Math.floor(Math.random() * 4)],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status: 'reported',
        reportedAt: new Date(today.getTime() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24 hours
      }));

      await Maintenance.insertMany(maintenanceRequests);
      console.log(`✅ Created ${maintenanceRequests.length} pending maintenance requests`);
    }

    // Update room statuses based on reservations
    const checkedInReservations = await Reservation.find({ status: 'checked-in' }).distinct('roomId');
    await Room.updateMany(
      { _id: { $in: checkedInReservations } },
      { status: 'occupied' }
    );
    console.log(`✅ Updated ${checkedInReservations.length} rooms to occupied status`);

    console.log('\n✅ Dashboard data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Rooms: ${await Room.countDocuments()}`);
    console.log(`   - Reservations: ${await Reservation.countDocuments()}`);
    console.log(`   - Billing Records: ${await Billing.countDocuments()}`);
    console.log(`   - Housekeeping Tasks: ${await Housekeeping.countDocuments()}`);
    console.log(`   - Maintenance Requests: ${await Maintenance.countDocuments()}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dashboard data:');
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

seedDashboardData();

