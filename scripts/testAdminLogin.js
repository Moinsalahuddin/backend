require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

async function testAdminLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database:', mongoose.connection.name);
    
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    console.log(`\n📋 Found ${admins.length} admin user(s):\n`);
    
    if (admins.length === 0) {
      console.log('⚠️ No admin users found in database!');
      console.log('\n💡 Creating test admin user...\n');
      
      // Create a test admin
      const testAdmin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@luxurystay.com',
        password: 'Admin123',
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ Test admin created successfully!');
      console.log('\n📋 Test Admin Credentials:');
      console.log('   Email: admin@luxurystay.com');
      console.log('   Password: Admin123');
      console.log('   Role: admin');
      
      await mongoose.disconnect();
      return;
    }
    
    // Display admin users
    for (const admin of admins) {
      console.log(`👤 Admin User:`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Has Password: ${admin.password ? 'Yes (hashed)' : 'No'}`);
      console.log(`   Password Length: ${admin.password ? admin.password.length : 0} characters`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    }
    
    // Test login for each admin
    console.log('\n🔐 Testing Password Verification:\n');
    
    for (const admin of admins) {
      console.log(`Testing login for: ${admin.email}`);
      
      // Test common passwords
      const testPasswords = ['Admin123', 'admin123', 'Admin', 'admin', 'password', 'Password123'];
      
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await admin.comparePassword(testPassword);
          if (isMatch) {
            console.log(`   ✅ Password match found: "${testPassword}"`);
            break;
          }
        } catch (error) {
          console.log(`   ❌ Error testing password "${testPassword}":`, error.message);
        }
      }
      console.log('');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔍 Full Error:', error);
    process.exit(1);
  }
}

testAdminLogin();

