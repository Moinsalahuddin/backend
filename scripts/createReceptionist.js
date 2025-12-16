const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

async function createReceptionist() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');

    // Import User model (try .js first, then .jsx)
    let User;
    try {
      User = require('../models/User.js');
    } catch (e) {
      User = require('../models/User.jsx');
    }

    // Check if receptionist already exists
    const existingUser = await User.findOne({ email: 'receptionist@gmail.com' });
    
    if (existingUser) {
      console.log('⚠️  Receptionist account already exists!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Name:', existingUser.firstName, existingUser.lastName);
      console.log('🔑 Role:', existingUser.role);
      console.log('\n✅ You can login with:');
      console.log('   Email: receptionist@gmail.com');
      console.log('   Password: Receptionist123');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create receptionist account
    const receptionist = await User.create({
      firstName: 'Receptionist',
      lastName: 'User',
      email: 'receptionist@gmail.com',
      password: 'Receptionist123',
      role: 'receptionist',
      phone: '',
      address: '',
      isActive: true
    });

    console.log('✅ Receptionist account created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: receptionist@gmail.com');
    console.log('   Password: Receptionist123');
    console.log('   Role: receptionist');
    console.log('\n🎉 You can now login with these credentials!');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating receptionist account:');
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

createReceptionist();

