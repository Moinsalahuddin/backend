require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

async function createGuest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database:', mongoose.connection.name);
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const email = args[0] || 'guest@gmail.com';
    const password = args[1] || 'Guest123';
    const firstName = args[2] || 'Guest';
    const lastName = args[3] || 'User';
    
    // Check if guest already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingGuest = await User.findOne({ email: normalizedEmail });
    
    if (existingGuest) {
      console.log(`\n⚠️ Guest with email "${email}" already exists!`);
      console.log('\n🔄 Updating existing guest password...');
      existingGuest.password = password;
      existingGuest.isActive = true;
      await existingGuest.save();
      
      console.log('✅ Guest password updated successfully!');
      console.log('\n📋 Updated Guest Credentials:');
      console.log(`   Email: ${existingGuest.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${existingGuest.role}`);
      
      await mongoose.disconnect();
      return;
    }
    
    // Create new guest
    console.log('\n🔨 Creating new guest user...');
    const guest = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      role: 'guest',
      isActive: true
    });
    
    console.log('✅ Guest created successfully!');
    console.log('\n📋 Guest Credentials:');
    console.log(`   Email: ${guest.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${guest.role}`);
    console.log(`   ID: ${guest._id}`);
    
    // Verify password
    console.log('\n🔐 Verifying password...');
    const isValid = await guest.comparePassword(password);
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 Guest setup completed!');
    console.log('💡 You can now login with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('E11000') || error.message.includes('duplicate')) {
      console.error('\n⚠️ Email already exists! Please use a different email or update existing user.');
    }
    if (error.message.includes('email')) {
      console.error('\n⚠️ Invalid email format! Please use format: example@gmail.com');
    }
    console.error('\n🔍 Full Error:', error);
    process.exit(1);
  }
}

createGuest();

