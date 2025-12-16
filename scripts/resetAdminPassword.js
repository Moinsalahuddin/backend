require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database:', mongoose.connection.name);
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const email = args[0] || 'admin@gmail.com';
    const newPassword = args[1] || 'Admin123';
    
    // Find user by email
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log(`\n❌ User with email "${email}" not found!`);
      console.log('\n💡 Available admin users:');
      const allAdmins = await User.find({ role: 'admin' });
      if (allAdmins.length === 0) {
        console.log('   No admin users found.');
      } else {
        allAdmins.forEach((admin, index) => {
          console.log(`   ${index + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`);
        });
      }
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`\n👤 Found user:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Reset password
    console.log(`\n🔄 Resetting password to: "${newPassword}"...`);
    user.password = newPassword;
    user.isActive = true; // Ensure user is active
    await user.save();
    
    console.log('✅ Password reset successfully!');
    
    // Verify password
    console.log('\n🔐 Verifying new password...');
    const isValid = await user.comparePassword(newPassword);
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('\n📋 Updated Credentials:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`   Role: ${user.role}`);
    
    await mongoose.disconnect();
    console.log('\n🎉 Password reset completed!');
    console.log('💡 You can now login with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n🔍 Full Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();

