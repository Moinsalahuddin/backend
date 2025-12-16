const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const emailService = require('../utils/emailService');

async function testEmail() {
  try {
    // Connect to MongoDB (needed for email settings)
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing Email Service...\n');

    // Test 1: Simple email
    const testEmailAddress = 'zrashid047@gmail.com'; // Change if needed
    const subject = 'Test Email - LuxuryStay';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Test Email</h2>
        <p>This is a test email from LuxuryStay Hotel Management System.</p>
        <p>If you receive this email, your email configuration is working correctly!</p>
        <p>Best regards,<br>LuxuryStay Team</p>
      </div>
    `;

    console.log(`📧 Sending test email to: ${testEmailAddress}`);
    const result = await emailService.sendEmail(testEmailAddress, subject, html);

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log(`   MessageId: ${result.messageId}`);
      console.log(`\n📬 Check your inbox: ${testEmailAddress}`);
      console.log('   (Check spam folder if not in inbox)');
    } else {
      console.log('\n❌ Email failed to send!');
      console.log(`   Error: ${result.error || result.message}`);
      console.log('\n🔍 Troubleshooting:');
      console.log('   1. Check if email settings are configured in database');
      console.log('   2. Verify SMTP credentials (smtpHost, smtpUser, smtpPassword)');
      console.log('   3. Check if App Password is correct (Gmail)');
      console.log('   4. Verify 2-Step Verification is enabled on Gmail');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing email:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
}

// Run the test
testEmail();

