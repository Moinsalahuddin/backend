const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Gallery = require('../models/Gallery');

// Sample gallery images with placeholder URLs
const sampleImages = [
  {
    title: 'Luxury Suite',
    description: 'Spacious and elegant suite with modern amenities and stunning city views',
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    cloudinaryId: 'sample_suite_1',
    category: 'rooms',
    isActive: true
  },
  {
    title: 'Single Bed Room',
    description: 'Comfortable single bed room with modern amenities, perfect for solo travelers',
    imageUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    cloudinaryId: 'sample_single_bed_1',
    category: 'rooms',
    isActive: true
  },
  {
    title: 'Twin Bed Room',
    description: 'Spacious room with two separate beds, ideal for friends or business travelers',
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    cloudinaryId: 'sample_twin_bed_1',
    category: 'rooms',
    isActive: true
  },
  {
    title: 'Double Bed Room',
    description: 'Elegant room with a comfortable double bed, perfect for couples',
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
    cloudinaryId: 'sample_double_bed_1',
    category: 'rooms',
    isActive: true
  },
  {
    title: 'Deluxe Room',
    description: 'Comfortable deluxe room with premium furnishings and en-suite bathroom',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    cloudinaryId: 'sample_deluxe_1',
    category: 'rooms',
    isActive: true
  },
  {
    title: 'Presidential Suite',
    description: 'Ultra-luxurious presidential suite with private balcony and premium amenities',
    imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
    cloudinaryId: 'sample_presidential_1',
    category: 'rooms',
    isActive: true
  },
  {
    title: 'Swimming Pool',
    description: 'Beautiful infinity pool with panoramic views and poolside bar',
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    cloudinaryId: 'sample_pool_1',
    category: 'amenities',
    isActive: true
  },
  {
    title: 'Spa & Wellness Center',
    description: 'Relaxing spa facilities with professional massage and treatment rooms',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    cloudinaryId: 'sample_spa_1',
    category: 'amenities',
    isActive: true
  },
  {
    title: 'Fitness Center',
    description: 'State-of-the-art gym with modern equipment and personal trainers',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    cloudinaryId: 'sample_gym_1',
    category: 'amenities',
    isActive: true
  },
  {
    title: 'Fine Dining Restaurant',
    description: 'Elegant restaurant offering exquisite cuisine and fine wines',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    cloudinaryId: 'sample_restaurant_1',
    category: 'dining',
    isActive: true
  },
  {
    title: 'Rooftop Bar',
    description: 'Stylish rooftop bar with signature cocktails and city skyline views',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    cloudinaryId: 'sample_bar_1',
    category: 'dining',
    isActive: true
  },
  {
    title: 'Breakfast Buffet',
    description: 'Extensive breakfast buffet with international and local delicacies',
    imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    cloudinaryId: 'sample_breakfast_1',
    category: 'dining',
    isActive: true
  },
  {
    title: 'Wedding Venue',
    description: 'Grand ballroom perfect for weddings and special celebrations',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    cloudinaryId: 'sample_wedding_1',
    category: 'events',
    isActive: true
  },
  {
    title: 'Conference Hall',
    description: 'Modern conference facilities for business meetings and events',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    cloudinaryId: 'sample_conference_1',
    category: 'events',
    isActive: true
  },
  {
    title: 'Hotel Lobby',
    description: 'Grand entrance with elegant furnishings and welcoming atmosphere',
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    cloudinaryId: 'sample_lobby_1',
    category: 'general',
    isActive: true
  },
  {
    title: 'Exterior View',
    description: 'Impressive hotel exterior with modern architecture and beautiful landscaping',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    cloudinaryId: 'sample_exterior_1',
    category: 'general',
    isActive: true
  },
  {
    title: 'Reception Area',
    description: 'Professional reception desk with friendly staff ready to assist',
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    cloudinaryId: 'sample_reception_1',
    category: 'general',
    isActive: true
  }
];

async function addSampleImages() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if images already exist
    const existingImages = await Gallery.countDocuments();
    if (existingImages > 0) {
      console.log(`⚠️  Gallery already has ${existingImages} images.`);
      console.log('🗑️  Deleting existing images to add fresh ones...');
      await Gallery.deleteMany({});
      console.log('✅ Deleted existing images');
    }

    // Add sample images
    const insertedImages = await Gallery.insertMany(sampleImages);
    console.log(`✅ Successfully added ${insertedImages.length} sample images to gallery!`);
    console.log('\n📊 Image breakdown:');
    const categoryCount = {};
    insertedImages.forEach(img => {
      categoryCount[img.category] = (categoryCount[img.category] || 0) + 1;
    });
    Object.keys(categoryCount).forEach(cat => {
      console.log(`   ${cat}: ${categoryCount[cat]} images`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample images:', error.message);
    process.exit(1);
  }
}

// Run the script
addSampleImages();

