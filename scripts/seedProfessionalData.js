const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

// Import Models
const User = require('../models/User');
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const Billing = require('../models/Billing');
const Housekeeping = require('../models/Housekeeping');
const Maintenance = require('../models/Maintenance');
const Feedback = require('../models/Feedback');
const ServiceRequest = require('../models/ServiceRequest');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');

// Professional Names Data
const professionalNames = {
  admin: [
    { firstName: 'Alexander', lastName: 'Thompson', email: 'admin@luxurystay.com', phone: '+1-555-0101' },
  ],
  manager: [
    { firstName: 'Victoria', lastName: 'Chen', email: 'manager@luxurystay.com', phone: '+1-555-0102' },
  ],
  receptionist: [
    { firstName: 'Sophia', lastName: 'Rodriguez', email: 'sophia.rodriguez@luxurystay.com', phone: '+1-555-0201' },
    { firstName: 'James', lastName: 'Mitchell', email: 'james.mitchell@luxurystay.com', phone: '+1-555-0202' },
    { firstName: 'Isabella', lastName: 'Anderson', email: 'isabella.anderson@luxurystay.com', phone: '+1-555-0203' },
  ],
  housekeeping: [
    { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@luxurystay.com', phone: '+1-555-0301' },
    { firstName: 'David', lastName: 'Kim', email: 'david.kim@luxurystay.com', phone: '+1-555-0302' },
    { firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@luxurystay.com', phone: '+1-555-0303' },
    { firstName: 'Carlos', lastName: 'Martinez', email: 'carlos.martinez@luxurystay.com', phone: '+1-555-0304' },
  ],
  guest: [
    { firstName: 'Robert', lastName: 'Johnson', email: 'robert.johnson@email.com', phone: '+1-555-1001' },
    { firstName: 'Emily', lastName: 'Williams', email: 'emily.williams@email.com', phone: '+1-555-1002' },
    { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@email.com', phone: '+1-555-1003' },
    { firstName: 'Sarah', lastName: 'Davis', email: 'sarah.davis@email.com', phone: '+1-555-1004' },
    { firstName: 'Daniel', lastName: 'Miller', email: 'daniel.miller@email.com', phone: '+1-555-1005' },
    { firstName: 'Jessica', lastName: 'Wilson', email: 'jessica.wilson@email.com', phone: '+1-555-1006' },
    { firstName: 'Christopher', lastName: 'Moore', email: 'christopher.moore@email.com', phone: '+1-555-1007' },
    { firstName: 'Amanda', lastName: 'Taylor', email: 'amanda.taylor@email.com', phone: '+1-555-1008' },
    { firstName: 'Matthew', lastName: 'Anderson', email: 'matthew.anderson@email.com', phone: '+1-555-1009' },
    { firstName: 'Lauren', lastName: 'Thomas', email: 'lauren.thomas@email.com', phone: '+1-555-1010' },
  ]
};

// Professional Room Descriptions
const roomDescriptions = {
  Single: 'Elegantly designed single room featuring a comfortable queen-size bed, modern amenities, and a serene atmosphere perfect for solo travelers seeking comfort and tranquility.',
  Double: 'Spacious double room with two queen beds, ideal for couples or business travelers. Features premium linens, work desk, and city views.',
  Deluxe: 'Luxurious deluxe room with king-size bed, separate seating area, premium bathroom amenities, and stunning panoramic views. Perfect for an enhanced stay experience.',
  Suite: 'Expansive suite featuring a separate living area, master bedroom with king bed, premium minibar, and exclusive access to executive lounge. Ideal for extended stays.',
  Presidential: 'Ultimate luxury in our presidential suite. Features multiple bedrooms, private dining area, butler service, Jacuzzi, and breathtaking city views. The pinnacle of hospitality excellence.'
};

// Professional Room Images (High-quality Unsplash images)
const roomImages = {
  Single: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop'
  ],
  Double: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop'
  ],
  Deluxe: [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop'
  ],
  Suite: [
    'https://images.unsplash.com/photo-1595576508896-5b3e0b3b3b3b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop'
  ],
  Presidential: [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop'
  ]
};

// Professional Feedback Comments
const feedbackComments = {
  excellent: [
    'Exceptional service and attention to detail. The staff went above and beyond to ensure our comfort.',
    'Outstanding experience from check-in to check-out. The room was immaculate and the amenities exceeded expectations.',
    'Perfect stay! The hotel truly lives up to its luxury reputation. Highly recommend.',
    'Impeccable service and beautiful accommodations. Will definitely return.',
    'Five-star experience in every aspect. The staff was professional, courteous, and attentive.'
  ],
  good: [
    'Very pleasant stay with comfortable rooms and good service. Minor improvements could enhance the experience.',
    'Nice hotel with clean facilities. Staff was helpful and accommodating.',
    'Good value for money. The location is convenient and the amenities are adequate.',
    'Satisfactory experience overall. Room was clean and service was prompt.',
    'Decent stay with standard amenities. Met our basic expectations.'
  ],
  average: [
    'Average experience. Room was acceptable but some areas need attention.',
    'The stay was okay, though some services could be improved.',
    'Standard hotel experience. Nothing exceptional but nothing terrible either.'
  ]
};

async function seedProfessionalData() {
  try {
    console.log('🚀 Starting Professional Data Seeding...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully\n');

    // ============================================
    // 1. CREATE PROFESSIONAL USERS
    // ============================================
    console.log('👥 Creating professional users...');
    
    const createdUsers = {};
    const password = await bcrypt.hash('LuxuryStay123', 10);
    
    for (const [role, users] of Object.entries(professionalNames)) {
      createdUsers[role] = [];
      for (const userData of users) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = await User.create({
            ...userData,
            password: password,
            role: role,
            isActive: true
          });
          createdUsers[role].push(user);
          console.log(`   ✅ Created ${role}: ${userData.firstName} ${userData.lastName}`);
        } else {
          createdUsers[role].push(existingUser);
          console.log(`   ℹ️  ${role} already exists: ${userData.firstName} ${userData.lastName}`);
        }
      }
    }
    
    const adminUser = createdUsers['admin'][0];
    const managerUser = createdUsers['manager'][0];
    const receptionistUsers = createdUsers['receptionist'];
    const housekeepingUsers = createdUsers['housekeeping'];
    const guestUsers = createdUsers['guest'];
    
    console.log(`\n✅ Users created: ${await User.countDocuments()} total\n`);

    // ============================================
    // 2. CREATE PROFESSIONAL ROOMS
    // ============================================
    console.log('🏨 Creating professional rooms...');
    
    const existingRooms = await Room.countDocuments();
    if (existingRooms < 50) {
      const rooms = [];
      const roomTypes = ['Single', 'Double', 'Deluxe', 'Suite', 'Presidential'];
      const amenitiesMap = {
        'Single': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Mini Refrigerator', 'Coffee Maker'],
        'Double': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Mini Refrigerator', 'Coffee Maker', 'Work Desk'],
        'Deluxe': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Premium Minibar', 'Coffee Maker', 'Work Desk', 'City View'],
        'Suite': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Premium Minibar', 'Coffee Maker', 'Separate Living Area', 'Executive Lounge Access', 'City View'],
        'Presidential': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Premium Minibar', 'Coffee Maker', 'Separate Living Area', 'Executive Lounge Access', 'Butler Service', 'Jacuzzi', 'Panoramic Views']
      };
      const priceMap = { 'Single': 150, 'Double': 200, 'Deluxe': 300, 'Suite': 500, 'Presidential': 1200 };
      const occupancyMap = { 'Single': 1, 'Double': 2, 'Deluxe': 2, 'Suite': 4, 'Presidential': 6 };

      // Create rooms floor by floor
      for (let floor = 1; floor <= 10; floor++) {
        const roomsPerFloor = floor <= 8 ? 5 : (floor === 9 ? 3 : 2); // Floors 1-8: 5 rooms, Floor 9: 3 rooms, Floor 10: 2 suites
        
        for (let room = 1; room <= roomsPerFloor; room++) {
          let roomType;
          if (floor === 10) {
            roomType = 'Presidential';
          } else if (floor === 9) {
            roomType = 'Suite';
          } else {
            // Distribute room types across floors
            const typeIndex = (floor - 1) % 3;
            if (typeIndex === 0) roomType = room <= 2 ? 'Single' : (room <= 4 ? 'Double' : 'Deluxe');
            else if (typeIndex === 1) roomType = room <= 2 ? 'Double' : (room <= 4 ? 'Deluxe' : 'Single');
            else roomType = room <= 2 ? 'Deluxe' : (room <= 4 ? 'Single' : 'Double');
          }
          
          const roomNumber = `${floor}${String(room).padStart(2, '0')}`;
          
          // Get images for this room type
          const availableImages = roomImages[roomType];
          const numImages = Math.floor(Math.random() * 2) + 2; // 2-3 images per room
          const selectedImages = [];
          for (let i = 0; i < numImages && i < availableImages.length; i++) {
            selectedImages.push(availableImages[i]);
          }
          
          rooms.push({
            roomNumber: roomNumber,
            roomType: roomType,
            floor: floor,
            pricePerNight: priceMap[roomType],
            status: 'available',
            maxOccupancy: occupancyMap[roomType],
            amenities: amenitiesMap[roomType],
            description: roomDescriptions[roomType],
            images: selectedImages
          });
        }
      }

      await Room.insertMany(rooms);
      console.log(`   ✅ Created ${rooms.length} professional rooms`);
    } else {
      console.log(`   ℹ️  ${existingRooms} rooms already exist`);
    }

    const allRooms = await Room.find();
    console.log(`\n✅ Total rooms: ${allRooms.length}\n`);

    // ============================================
    // 3. CREATE PROFESSIONAL RESERVATIONS
    // ============================================
    console.log('📅 Creating professional reservations...');
    
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

    // Today's check-ins
    const todayCheckInCount = await Reservation.countDocuments({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'checked-in'] }
    });

    if (todayCheckInCount < 10) {
      const roomsForToday = allRooms.slice(0, 10);
      const todayReservations = [];
      
      for (let i = 0; i < roomsForToday.length; i++) {
        const room = roomsForToday[i];
        const nights = Math.floor(Math.random() * 4) + 1;
        const checkOut = new Date(today);
        checkOut.setDate(checkOut.getDate() + nights);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const confirmationNumber = 'LUX' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase() + i.toString().padStart(2, '0');
        
        todayReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: today,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(room.maxOccupancy, Math.floor(Math.random() * 2) + 1),
          totalAmount: room.pricePerNight * nights,
          status: i < 6 ? 'checked-in' : 'confirmed',
          paymentStatus: i < 6 ? 'paid' : 'pending',
          bookingSource: ['online', 'walk-in', 'phone'][Math.floor(Math.random() * 3)],
          confirmationNumber: confirmationNumber,
          specialRequests: i % 3 === 0 ? 'Late check-in requested' : (i % 3 === 1 ? 'Extra towels needed' : null)
        });
      }

      await Reservation.insertMany(todayReservations);
      console.log(`   ✅ Created ${todayReservations.length} reservations for today`);
    }

    // Today's check-outs
    const todayCheckOutCount = await Reservation.countDocuments({
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: 'checked-in'
    });

    if (todayCheckOutCount < 8) {
      const roomsForCheckOut = allRooms.slice(10, 18);
      const checkOutReservations = [];
      
      for (let i = 0; i < roomsForCheckOut.length; i++) {
        const room = roomsForCheckOut[i];
        const checkIn = new Date(yesterday);
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 4));
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const confirmationNumber = 'LUX' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase() + (i + 100).toString().padStart(2, '0');
        
        const nights = Math.ceil((today - checkIn) / (1000 * 60 * 60 * 24));
        checkOutReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: today,
          numberOfGuests: Math.min(room.maxOccupancy, Math.floor(Math.random() * 2) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'checked-in',
          paymentStatus: 'paid',
          bookingSource: ['online', 'walk-in'][Math.floor(Math.random() * 2)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(checkOutReservations);
      console.log(`   ✅ Created ${checkOutReservations.length} check-out reservations for today`);
    }

    // Current checked-in reservations
    const checkedInCount = await Reservation.countDocuments({ status: 'checked-in' });
    if (checkedInCount < 20) {
      const needed = 20 - checkedInCount;
      const roomsForOccupancy = allRooms.slice(18, 18 + needed);
      const occupancyReservations = [];
      
      for (let i = 0; i < roomsForOccupancy.length; i++) {
        const room = roomsForOccupancy[i];
        const checkIn = new Date(yesterday);
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 5));
        const checkOut = new Date(today);
        checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 4) + 1);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const confirmationNumber = 'LUX' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase() + (i + 200).toString().padStart(2, '0');
        
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        occupancyReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(room.maxOccupancy, Math.floor(Math.random() * 2) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'checked-in',
          paymentStatus: 'paid',
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

    if (pastReservationsCount < 25) {
      const roomsForPast = allRooms.slice(20, 30);
      const pastReservations = [];
      
      for (let i = 0; i < Math.min(roomsForPast.length, 25); i++) {
        const room = roomsForPast[i];
        const checkOut = new Date(yesterday);
        checkOut.setDate(checkOut.getDate() - Math.floor(Math.random() * 30));
        const checkIn = new Date(checkOut);
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 5) - 1);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const confirmationNumber = 'LUX' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase() + (i + 300).toString().padStart(2, '0');
        
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        pastReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(room.maxOccupancy, Math.floor(Math.random() * 2) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'checked-out',
          paymentStatus: 'paid',
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

    if (futureReservationsCount < 20) {
      const roomsForFuture = allRooms.slice(15, 25);
      const futureReservations = [];
      
      for (let i = 0; i < Math.min(roomsForFuture.length, 20); i++) {
        const room = roomsForFuture[i];
        const checkIn = new Date(tomorrow);
        checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 14));
        const nights = Math.floor(Math.random() * 5) + 1;
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + nights);
        const guest = guestUsers[Math.floor(Math.random() * guestUsers.length)];
        
        const confirmationNumber = 'LUX' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase() + (i + 400).toString().padStart(2, '0');
        
        futureReservations.push({
          guestId: guest._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Math.min(room.maxOccupancy, Math.floor(Math.random() * 2) + 1),
          totalAmount: room.pricePerNight * nights,
          status: 'confirmed',
          paymentStatus: 'partial',
          bookingSource: ['online', 'phone', 'agent'][Math.floor(Math.random() * 3)],
          confirmationNumber: confirmationNumber
        });
      }

      await Reservation.insertMany(futureReservations);
      console.log(`   ✅ Created ${futureReservations.length} future reservations`);
    }

    const allReservations = await Reservation.find();
    console.log(`\n✅ Total reservations: ${allReservations.length}\n`);

    // ============================================
    // 4. CREATE PROFESSIONAL BILLING
    // ============================================
    console.log('💳 Creating professional billing records...');
    
    const checkedOutReservations = await Reservation.find({ status: 'checked-out' }).limit(20);
    const billingCount = await Billing.countDocuments();
    
    if (billingCount < checkedOutReservations.length) {
      const billings = [];
      
      for (const reservation of checkedOutReservations) {
        const existingBilling = await Billing.findOne({ reservationId: reservation._id });
        if (!existingBilling) {
          const room = await Room.findById(reservation.roomId);
          const nights = Math.ceil((reservation.checkOutDate - reservation.checkInDate) / (1000 * 60 * 60 * 24));
          const roomCharges = room.pricePerNight * nights;
          
          // Add some additional services
          const additionalServices = [];
          const serviceTypes = ['food', 'laundry', 'spa', 'transportation'];
          const numServices = Math.floor(Math.random() * 3);
          
          for (let i = 0; i < numServices; i++) {
            const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
            const serviceNames = {
              'food': ['Room Service - Dinner', 'Room Service - Breakfast', 'Mini Bar', 'Wine Selection'],
              'laundry': ['Dry Cleaning', 'Laundry Service', 'Express Laundry'],
              'spa': ['Massage Therapy', 'Facial Treatment', 'Spa Package'],
              'transportation': ['Airport Transfer', 'City Tour', 'Car Rental']
            };
            const unitPrices = {
              'food': [45, 35, 25, 80],
              'laundry': [30, 20, 40],
              'spa': [120, 90, 200],
              'transportation': [60, 100, 150]
            };
            
            const serviceName = serviceNames[serviceType][Math.floor(Math.random() * serviceNames[serviceType].length)];
            const unitPrice = unitPrices[serviceType][Math.floor(Math.random() * unitPrices[serviceType].length)];
            const quantity = Math.floor(Math.random() * 2) + 1;
            
            additionalServices.push({
              serviceName: serviceName,
              serviceType: serviceType,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: unitPrice * quantity,
              date: new Date(reservation.checkInDate.getTime() + Math.random() * (reservation.checkOutDate - reservation.checkInDate))
            });
          }
          
          const servicesTotal = additionalServices.reduce((sum, s) => sum + s.totalPrice, 0);
          const subtotal = roomCharges + servicesTotal;
          const taxes = subtotal * 0.12; // 12% tax
          const discount = Math.random() > 0.7 ? subtotal * 0.1 : 0; // 10% discount sometimes
          const totalAmount = subtotal + taxes - discount;
          
          const invoiceNumber = 'INV' + Date.now().toString().slice(-10) + Math.random().toString(36).substr(2, 3).toUpperCase();
          
          billings.push({
            reservationId: reservation._id,
            guestId: reservation.guestId,
            roomCharges: roomCharges,
            additionalServices: additionalServices,
            taxes: taxes,
            discount: discount,
            totalAmount: totalAmount,
            paymentStatus: 'paid',
            paymentMethod: ['card', 'cash', 'bank-transfer'][Math.floor(Math.random() * 3)],
            invoiceNumber: invoiceNumber,
            issuedAt: reservation.checkOutDate,
            paidAt: new Date(reservation.checkOutDate.getTime() + Math.random() * 3600000) // Within 1 hour of checkout
          });
        }
      }
      
      if (billings.length > 0) {
        await Billing.insertMany(billings);
        console.log(`   ✅ Created ${billings.length} professional billing records`);
      }
    } else {
      console.log(`   ℹ️  ${billingCount} billing records already exist`);
    }
    
    console.log(`\n✅ Total billing records: ${await Billing.countDocuments()}\n`);

    // ============================================
    // 5. CREATE PROFESSIONAL HOUSEKEEPING TASKS
    // ============================================
    console.log('🧹 Creating professional housekeeping tasks...');
    
    const occupiedRooms = await Reservation.find({ status: 'checked-in' }).populate('roomId');
    const housekeepingCount = await Housekeeping.countDocuments();
    
    if (housekeepingCount < 15) {
      const tasks = [];
      const taskTypes = ['cleaning', 'deep-cleaning', 'inspection'];
      const priorities = ['low', 'medium', 'high'];
      
      for (let i = 0; i < Math.min(occupiedRooms.length, 15); i++) {
        const reservation = occupiedRooms[i];
        const room = reservation.roomId;
        const housekeeper = housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)];
        const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 3));
        
        const statuses = ['pending', 'in-progress', 'completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        tasks.push({
          roomId: room._id,
          assignedTo: housekeeper._id,
          taskType: taskType,
          status: status,
          scheduledDate: scheduledDate,
          completedDate: status === 'completed' ? new Date(scheduledDate.getTime() + Math.random() * 7200000) : null,
          priority: priority,
          notes: taskType === 'deep-cleaning' ? 'Deep cleaning required after extended stay' : 
                 taskType === 'inspection' ? 'Routine room inspection' : 
                 'Standard room cleaning service'
        });
      }
      
      await Housekeeping.insertMany(tasks);
      console.log(`   ✅ Created ${tasks.length} professional housekeeping tasks`);
    } else {
      console.log(`   ℹ️  ${housekeepingCount} housekeeping tasks already exist`);
    }
    
    console.log(`\n✅ Total housekeeping tasks: ${await Housekeeping.countDocuments()}\n`);

    // ============================================
    // 6. CREATE PROFESSIONAL MAINTENANCE REQUESTS
    // ============================================
    console.log('🛠️  Creating professional maintenance requests...');
    
    const maintenanceCount = await Maintenance.countDocuments();
    
    if (maintenanceCount < 10) {
      const maintenanceRequests = [];
      const issueTypes = ['plumbing', 'electrical', 'hvac', 'furniture', 'appliance'];
      const priorities = ['low', 'medium', 'high', 'urgent'];
      const descriptions = {
        'plumbing': ['Leaky faucet in bathroom', 'Low water pressure', 'Drain blockage', 'Shower not working properly'],
        'electrical': ['Light fixture not working', 'Power outlet malfunction', 'AC unit electrical issue', 'Room lighting problem'],
        'hvac': ['Air conditioning not cooling', 'Heating system not working', 'Ventilation issue', 'Thermostat malfunction'],
        'furniture': ['Bed frame needs repair', 'Desk drawer stuck', 'Chair leg loose', 'Cabinet door not closing'],
        'appliance': ['TV remote not working', 'Refrigerator not cooling', 'Coffee maker malfunction', 'Safe not opening']
      };
      
      const someRooms = allRooms.slice(0, 10);
      
      for (let i = 0; i < Math.min(someRooms.length, 10); i++) {
        const room = someRooms[i];
        const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
        const description = descriptions[issueType][Math.floor(Math.random() * descriptions[issueType].length)];
        const priority = issueType === 'electrical' || issueType === 'plumbing' ? 
                        ['high', 'urgent'][Math.floor(Math.random() * 2)] : 
                        ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
        
        const reporter = Math.random() > 0.5 ? 
                        guestUsers[Math.floor(Math.random() * guestUsers.length)] : 
                        housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)];
        
        const statuses = ['reported', 'assigned', 'in-progress', 'resolved'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        maintenanceRequests.push({
          roomId: room._id,
          reportedBy: reporter._id,
          issueType: issueType,
          description: description,
          status: status,
          priority: priority,
          assignedTo: status !== 'reported' ? housekeepingUsers[Math.floor(Math.random() * housekeepingUsers.length)]._id : null,
          estimatedCost: Math.floor(Math.random() * 500) + 50,
          actualCost: status === 'resolved' ? Math.floor(Math.random() * 500) + 50 : null,
          reportedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          resolvedAt: status === 'resolved' ? new Date() : null,
          notes: status === 'resolved' ? 'Issue resolved successfully. All systems operational.' : 
                 status === 'in-progress' ? 'Maintenance team working on the issue.' : 
                 'Awaiting assignment to maintenance team.'
        });
      }
      
      await Maintenance.insertMany(maintenanceRequests);
      console.log(`   ✅ Created ${maintenanceRequests.length} professional maintenance requests`);
    } else {
      console.log(`   ℹ️  ${maintenanceCount} maintenance requests already exist`);
    }
    
    console.log(`\n✅ Total maintenance requests: ${await Maintenance.countDocuments()}\n`);

    // ============================================
    // 7. CREATE PROFESSIONAL FEEDBACK
    // ============================================
    console.log('⭐ Creating professional feedback...');
    
    const feedbackCount = await Feedback.countDocuments();
    const pastReservations = await Reservation.find({ status: 'checked-out' }).limit(15);
    
    if (feedbackCount < pastReservations.length) {
      const feedbacks = [];
      const categories = ['room', 'service', 'food', 'cleanliness', 'staff', 'overall'];
      
      for (const reservation of pastReservations) {
        const existingFeedback = await Feedback.findOne({ reservationId: reservation._id });
        if (!existingFeedback) {
          const rating = Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 2) + 3; // Mostly 4-5 stars
          const category = categories[Math.floor(Math.random() * categories.length)];
          
          let comment;
          if (rating >= 5) {
            comment = feedbackComments.excellent[Math.floor(Math.random() * feedbackComments.excellent.length)];
          } else if (rating >= 4) {
            comment = feedbackComments.good[Math.floor(Math.random() * feedbackComments.good.length)];
          } else {
            comment = feedbackComments.average[Math.floor(Math.random() * feedbackComments.average.length)];
          }
          
          feedbacks.push({
            guestId: reservation.guestId,
            reservationId: reservation._id,
            rating: rating,
            category: category,
            comment: comment,
            status: 'approved',
            isAnonymous: Math.random() > 0.7
          });
        }
      }
      
      if (feedbacks.length > 0) {
        await Feedback.insertMany(feedbacks);
        console.log(`   ✅ Created ${feedbacks.length} professional feedback entries`);
      }
    } else {
      console.log(`   ℹ️  ${feedbackCount} feedback entries already exist`);
    }
    
    console.log(`\n✅ Total feedback entries: ${await Feedback.countDocuments()}\n`);

    // ============================================
    // 8. CREATE PROFESSIONAL SERVICE REQUESTS
    // ============================================
    console.log('🛎️  Creating professional service requests...');
    
    const serviceCount = await ServiceRequest.countDocuments();
    const activeReservations = await Reservation.find({ status: 'checked-in' }).limit(10);
    
    if (serviceCount < activeReservations.length) {
      const serviceRequests = [];
      const serviceTypes = ['room-service', 'wake-up-call', 'transportation', 'laundry', 'spa', 'concierge', 'other'];
      const serviceNames = {
        'room-service': ['Breakfast in Room', 'Dinner Service', 'Late Night Snacks', 'Beverage Service'],
        'wake-up-call': ['Morning Wake-up Call', 'Early Morning Call'],
        'transportation': ['Airport Transfer', 'City Tour', 'Taxi Service'],
        'laundry': ['Dry Cleaning Service', 'Express Laundry', 'Regular Laundry'],
        'spa': ['Massage Therapy', 'Facial Treatment', 'Spa Package'],
        'concierge': ['Restaurant Reservation', 'Tour Booking', 'Event Tickets', 'Local Recommendations'],
        'other': ['Special Request', 'Custom Service']
      };
      
      for (const reservation of activeReservations) {
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        const serviceName = serviceNames[serviceType][Math.floor(Math.random() * serviceNames[serviceType].length)];
        
        const statuses = ['pending', 'confirmed', 'in-progress', 'completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        serviceRequests.push({
          guestId: reservation.guestId,
          reservationId: reservation._id,
          serviceType: serviceType,
          description: `Request for ${serviceName.toLowerCase()}`,
          status: status,
          scheduledTime: status !== 'pending' ? new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000) : null,
          assignedTo: status !== 'pending' ? receptionistUsers[Math.floor(Math.random() * receptionistUsers.length)]._id : null,
          cost: serviceType === 'spa' ? Math.floor(Math.random() * 200) + 50 : 
                serviceType === 'transportation' ? Math.floor(Math.random() * 100) + 30 :
                serviceType === 'room-service' ? Math.floor(Math.random() * 80) + 20 : 0
        });
      }
      
      await ServiceRequest.insertMany(serviceRequests);
      console.log(`   ✅ Created ${serviceRequests.length} professional service requests`);
    } else {
      console.log(`   ℹ️  ${serviceCount} service requests already exist`);
    }
    
    console.log(`\n✅ Total service requests: ${await ServiceRequest.countDocuments()}\n`);

    // ============================================
    // 9. CREATE SYSTEM SETTINGS
    // ============================================
    console.log('⚙️  Creating system settings...');
    
    const settingsCount = await SystemSettings.countDocuments();
    
    if (settingsCount === 0) {
      await SystemSettings.create({
        hotelName: 'LuxuryStay Hospitality',
        hotelAddress: '123 Luxury Boulevard, Premium District',
        hotelPhone: '+1-555-LUXURY',
        hotelEmail: 'info@luxurystay.com',
        taxRate: 12,
        currency: 'USD',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
        petPolicy: 'Pets allowed with prior approval',
        smokingPolicy: 'Non-smoking property',
        wifiPassword: 'LuxuryStay2024',
        parkingAvailable: true,
        parkingFee: 25,
        breakfastIncluded: false,
        breakfastPrice: 25
      });
      console.log(`   ✅ Created system settings`);
    } else {
      console.log(`   ℹ️  System settings already exist`);
    }

    // ============================================
    // 10. CREATE PROFESSIONAL NOTIFICATIONS
    // ============================================
    console.log('🔔 Creating professional notifications...');
    
    // Create notifications for admin/manager
    const adminNotifications = [
      { type: 'booking', title: 'New Reservation', message: 'New reservation confirmed for Room 101' },
      { type: 'checkin', title: 'Check-in Alert', message: 'Guest checked in to Room 205' },
      { type: 'checkout', title: 'Check-out Alert', message: 'Guest checked out from Room 312' },
      { type: 'maintenance', title: 'Maintenance Request', message: 'New maintenance request for Room 408' },
      { type: 'payment', title: 'Payment Received', message: 'Payment received for Reservation #LUX123456' }
    ];
    
    for (const notif of adminNotifications) {
      const existing = await Notification.findOne({ 
        userId: adminUser._id, 
        title: notif.title 
      });
      if (!existing) {
        await Notification.create({
          userId: adminUser._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          isRead: false
        });
      }
    }
    
    console.log(`   ✅ Created professional notifications`);

    console.log('\n✅ Professional Data Seeding Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${await User.countDocuments()}`);
    console.log(`   🏨 Rooms: ${await Room.countDocuments()}`);
    console.log(`   📅 Reservations: ${await Reservation.countDocuments()}`);
    console.log(`   💳 Billing Records: ${await Billing.countDocuments()}`);
    console.log(`   🧹 Housekeeping Tasks: ${await Housekeeping.countDocuments()}`);
    console.log(`   🛠️  Maintenance Requests: ${await Maintenance.countDocuments()}`);
    console.log(`   ⭐ Feedback Entries: ${await Feedback.countDocuments()}`);
    console.log(`   🛎️  Service Requests: ${await ServiceRequest.countDocuments()}`);
    console.log(`   🔔 Notifications: ${await Notification.countDocuments()}`);
    console.log(`   ⚙️  System Settings: ${await SystemSettings.countDocuments()}\n`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding professional data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seeding function
seedProfessionalData();

