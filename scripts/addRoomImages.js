const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

// Import Room Model
const Room = require('../models/Room');

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

async function addRoomImages() {
  try {
    console.log('🚀 Starting Room Images Update...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully\n');

    // Get all rooms
    const rooms = await Room.find();
    console.log(`📋 Found ${rooms.length} rooms to update\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const room of rooms) {
      // Skip if room already has images
      if (room.images && room.images.length > 0) {
        console.log(`   ⏭️  Room ${room.roomNumber} already has images, skipping...`);
        skippedCount++;
        continue;
      }

      // Get images for this room type
      const availableImages = roomImages[room.roomType];
      if (!availableImages || availableImages.length === 0) {
        console.log(`   ⚠️  No images available for room type: ${room.roomType}`);
        continue;
      }

      // Select 2-3 random images
      const numImages = Math.floor(Math.random() * 2) + 2; // 2-3 images
      const selectedImages = [];
      const shuffled = [...availableImages].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numImages && i < shuffled.length; i++) {
        selectedImages.push(shuffled[i]);
      }

      // Update room with images
      room.images = selectedImages;
      await room.save();
      
      console.log(`   ✅ Added ${selectedImages.length} images to Room ${room.roomNumber} (${room.roomType})`);
      updatedCount++;
    }

    console.log(`\n✅ Room Images Update Completed!\n`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} rooms`);
    console.log(`   ⏭️  Skipped: ${skippedCount} rooms (already have images)`);
    console.log(`   📸 Total rooms with images: ${await Room.countDocuments({ images: { $exists: true, $ne: [] } })}\n`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding room images:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
addRoomImages();

