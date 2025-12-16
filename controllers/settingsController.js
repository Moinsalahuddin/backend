const SystemSettings = require('../models/SystemSettings');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private (Admin, Manager)
exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = await SystemSettings.create({
        ...req.body,
        updatedBy: req.user._id
      });
    } else {
      // Update nested objects properly
      if (req.body.roomRates) {
        settings.roomRates = { ...settings.roomRates, ...req.body.roomRates };
      }
      if (req.body.taxSettings) {
        settings.taxSettings = { ...settings.taxSettings, ...req.body.taxSettings };
      }
      if (req.body.policies) {
        settings.policies = { ...settings.policies, ...req.body.policies };
      }
      if (req.body.hotelInfo) {
        settings.hotelInfo = { ...settings.hotelInfo, ...req.body.hotelInfo };
      }
      if (req.body.emailSettings) {
        settings.emailSettings = { ...settings.emailSettings, ...req.body.emailSettings };
      }
      if (req.body.notificationSettings) {
        settings.notificationSettings = { ...settings.notificationSettings, ...req.body.notificationSettings };
      }
      
      settings.updatedBy = req.user._id;
      settings.updatedAt = Date.now();
      await settings.save();
    }
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

