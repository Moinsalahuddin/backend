const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Notification = require('../models/Notification');
const User = require('../models/User');

async function createTestNotification() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all guest users
    const guests = await User.find({ role: 'guest' });
    if (!guests || guests.length === 0) {
      console.log('❌ No guest user found. Please create a guest user first.');
      process.exit(1);
    }

    console.log(`📧 Found ${guests.length} guest user(s). Creating test notifications for all...\n`);

    // Create test notifications for all guests
    const notifications = [];
    for (const guest of guests) {
      const notification = await Notification.create({
        userId: guest._id,
        type: 'booking',
        title: 'Test Notification',
        message: 'This is a test notification to verify the notification system is working.',
        relatedId: null,
        relatedModel: null,
        isRead: false // Explicitly set as unread
      });
      notifications.push(notification);
      console.log(`✅ Created unread notification for: ${guest.firstName} ${guest.lastName} (${guest._id})`);
    }

    console.log(`\n✅ Created ${notifications.length} test notification(s) successfully!`);
    console.log('\n📬 Now refresh your browser and check the notification bell icon.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test notification:', error.message);
    process.exit(1);
  }
}

createTestNotification();

