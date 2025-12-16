const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemSettings = require('../models/SystemSettings');

// Email Settings Configuration
const emailSettings = {
  smtpHost: 'smtp.gmail.com',              // ✅ Gmail SMTP server
  smtpPort: 587,                           // 587 for TLS
  smtpUser: 'zrashid047@gmail.com',        // ✅ YOUR EMAIL
  smtpPassword: 'kyon wcxj tggp ilmd',     // ✅ App Password
  fromEmail: 'zrashid047@gmail.com',       // ✅ YOUR EMAIL
  fromName: 'LuxuryStay Team'
};

async function fixEmailSettings() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create new settings
      settings = await SystemSettings.create({ emailSettings });
      console.log('✅ Created new settings');
    } else {
      // Force update - replace emailSettings completely
      settings.emailSettings = emailSettings;
      await settings.save();
      console.log('✅ Updated email settings (force update)');
    }

    // Verify what was saved
    const verifySettings = await SystemSettings.findOne();
    console.log('\n📧 Verified Email Settings in Database:');
    console.log(`   SMTP Host: "${verifySettings.emailSettings.smtpHost}"`);
    console.log(`   SMTP Port: ${verifySettings.emailSettings.smtpPort}`);
    console.log(`   SMTP User: ${verifySettings.emailSettings.smtpUser}`);
    console.log(`   From Email: ${verifySettings.emailSettings.fromEmail}`);
    console.log(`   Has Password: ${verifySettings.emailSettings.smtpPassword ? 'Yes (' + verifySettings.emailSettings.smtpPassword.length + ' chars)' : 'No'}`);

    if (!verifySettings.emailSettings.smtpHost || verifySettings.emailSettings.smtpHost.trim() === '') {
      console.error('\n❌ ERROR: smtpHost is still empty!');
      process.exit(1);
    }

    console.log('\n✅ Email settings saved successfully!');
    console.log('\n🧪 Now test email with: node scripts/testEmail.js');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing email settings:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
}

// Run the script
fixEmailSettings();

