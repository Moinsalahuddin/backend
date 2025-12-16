const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const mongoose = require('mongoose');
    
    // Ensure userId is properly formatted as ObjectId
    const userId = req.user._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user._id);
    
    const query = { userId: userId };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    console.log('🔔 Fetching notifications for user:', userId.toString(), 'Role:', req.user.role);
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ userId: userId, isRead: false });
    
    console.log(`📊 Found ${notifications.length} notifications, ${unreadCount} unread`);
    
    // If no notifications found with ObjectId query, try string comparison as fallback
    if (notifications.length === 0) {
      console.log('⚠️ No notifications found with ObjectId query, trying string comparison...');
      const allNotifications = await Notification.find({});
      const matchingNotifs = allNotifications.filter(n => {
        const notifUserId = n.userId instanceof mongoose.Types.ObjectId 
          ? n.userId.toString() 
          : n.userId;
        const reqUserId = userId.toString();
        return notifUserId === reqUserId;
      });
      
      if (matchingNotifs.length > 0) {
        console.log(`✅ Found ${matchingNotifs.length} notifications using string comparison`);
        return res.json({ 
          success: true, 
          notifications: matchingNotifs, 
          unreadCount: matchingNotifs.filter(n => !n.isRead).length 
        });
      }
    }
    
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to create notification
exports.createNotification = async (userId, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    if (!userId) {
      console.error('❌ Cannot create notification: userId is required');
      return null;
    }
    
    const mongoose = require('mongoose');
    // Ensure userId is ObjectId
    const userIdObj = userId instanceof mongoose.Types.ObjectId 
      ? userId 
      : new mongoose.Types.ObjectId(userId);
    
    const notification = await Notification.create({
      userId: userIdObj,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      isRead: false // Explicitly set as unread
    });
    console.log(`✅ Notification created for user ${userIdObj.toString()}: ${title} (isRead: false)`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error.message);
    console.error('Error details:', error);
    return null;
  }
};

// Helper function to notify all admins
exports.notifyAllAdmins = async (type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const User = require('../models/User');
    const admins = await User.find({ 
      role: { $in: ['admin', 'manager'] }, 
      isActive: true 
    }).select('_id');
    
    if (admins.length === 0) {
      return [];
    }

    const notifications = admins.map(admin => ({
      userId: admin._id,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      isRead: false // Explicitly set as unread
    }));

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Notified ${createdNotifications.length} admin(s): ${title}`);
    return createdNotifications;
  } catch (error) {
    console.error('Error notifying admins:', error);
    return [];
  }
};

