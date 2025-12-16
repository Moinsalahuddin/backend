const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getChattableUsers
} = require('../controllers/messageController');

// All routes require authentication
router.use(protect);

// IMPORTANT: Specific routes must come before parameterized routes
router.get('/users', getChattableUsers);
router.get('/conversations', getConversations);
router.get('/conversation/:userId', getOrCreateConversation); // Must come before /:conversationId
router.post('/', sendMessage);
router.get('/:conversationId', getMessages); // This should be last as it matches any string

module.exports = router;



