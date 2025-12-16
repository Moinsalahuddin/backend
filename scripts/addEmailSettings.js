const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemSettings = require('../models/SystemSettings');

// Email Settings Configuration
const emailSettings = {
  smtpHost: 'smtp.gmail.com',              // ✅ Gmail SMTP server (email address nahi!)
  smtpPort: 587,                           // 587 for TLS, 465 for SSL
  smtpUser: 'zrashid047@gmail.com',     // ✅ YOUR EMAIL HERE
  smtpPassword: 'kyon wcxj tggp ilmd',  // ⚠️ App Password yahan dalo (16 char code from Google)
  fromEmail: 'zrashid047@gmail.com',    // ✅ YOUR EMAIL HERE
  fromName: 'LuxuryStay Team'
};

async function addEmailSettings() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create new settings with email configuration
      settings = await SystemSettings.create({
        emailSettings: emailSettings
      });
      console.log('✅ Created new settings with email configuration');
    } else {
      // Update existing settings
      settings.emailSettings = {
        ...settings.emailSettings,
        ...emailSettings
      };
      await settings.save();
      console.log('✅ Updated existing settings with email configuration');
    }

    console.log('\n📧 Email Settings Saved:');
    console.log(`   SMTP Host: ${settings.emailSettings.smtpHost}`);
    console.log(`   SMTP Port: ${settings.emailSettings.smtpPort}`);
    console.log(`   SMTP User: ${settings.emailSettings.smtpUser}`);
    console.log(`   From Email: ${settings.emailSettings.fromEmail}`);
    console.log(`   From Name: ${settings.emailSettings.fromName}`);
    console.log('\n⚠️  Make sure to update emailSettings object in this file with your real credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding email settings:', error.message);
    process.exit(1);
  }
}

// Run the script
addEmailSettings();

