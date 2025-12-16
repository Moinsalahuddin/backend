const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Gallery = require('../models/Gallery');

const router = express.Router();

// Configure Cloudinary (only if credentials are provided)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️ Cloudinary credentials not configured. Gallery upload functionality will be disabled.');
}

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// @route   GET /api/gallery
// @desc    Get all gallery images
// @access  Public (for guests)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all') {
      query.category = category;
    }
    const images = await Gallery.find(query)
      .sort({ createdAt: -1 });
    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/gallery
// @desc    Upload gallery image (Admin/Manager only)
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('admin', 'manager'), upload.single('image'), async (req, res) => {
  try {
    if (!cloudinary.config().cloud_name) {
      return res.status(500).json({ message: 'Cloudinary is not configured. Please configure Cloudinary credentials in System Settings.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    if (!req.body.title || !req.body.title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'luxurystay/gallery', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const galleryImage = await Gallery.create({
      title: req.body.title.trim(),
      description: req.body.description || '',
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
      category: req.body.category || 'general',
      uploadedBy: req.user._id
    });

    res.status(201).json({ success: true, image: galleryImage });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery image (Admin/Manager only)
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (!cloudinary.config().cloud_name) {
      return res.status(500).json({ message: 'Cloudinary is not configured.' });
    }

    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    if (image.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    await image.deleteOne();
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Gallery delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

