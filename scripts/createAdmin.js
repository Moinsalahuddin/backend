require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const email = args[0] || 'admin@luxurystay.com';
    const password = args[1] || 'Admin123';
    const firstName = args[2] || 'Admin';
    const lastName = args[3] || 'User';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log(`\n⚠️ Admin with email "${email}" already exists!`);
      console.log('\nOptions:');
      console.log('1. Delete existing admin and create new one');
      console.log('2. Update existing admin password');
      console.log('3. Cancel');
      
      // For script, we'll update password
      console.log('\n🔄 Updating existing admin password...');
      existingAdmin.password = password;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully!');
      console.log('\n📋 Updated Admin Credentials:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      await mongoose.disconnect();
      return;
    }
    
    // Create new admin
    console.log('\n🔨 Creating new admin user...');
    const admin = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Admin created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);
    
    // Verify password
    console.log('\n🔐 Verifying password...');
    const isValid = await admin.comparePassword(password);
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 Admin setup completed!');
    console.log('💡 You can now login with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('E11000') || error.message.includes('duplicate')) {
      console.error('\n⚠️ Email already exists! Please use a different email or update existing user.');
    }
    console.error('\n🔍 Full Error:', error);
    process.exit(1);
  }
}

createAdmin();

