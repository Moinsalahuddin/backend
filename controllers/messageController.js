const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get or create conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
  try {
    // Validate req.user exists
    if (!req.user || !req.user._id) {
      console.error('[getOrCreateConversation] req.user is missing or invalid');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    console.log(`[getOrCreateConversation] Current user: ${req.user.role} (${currentUserId}), Other user: ${otherUserId}`);

    // Validate userId parameter
    if (!otherUserId) {
      console.error(`[getOrCreateConversation] Missing userId parameter`);
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      console.error(`[getOrCreateConversation] Invalid userId format: ${otherUserId}`);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (currentUserId.toString() === otherUserId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if other user exists and is active
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      console.error(`[getOrCreateConversation] User not found: ${otherUserId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!otherUser.isActive) {
      console.error(`[getOrCreateConversation] User is inactive: ${otherUserId}`);
      return res.status(403).json({ message: 'Cannot chat with inactive user' });
    }

    console.log(`[getOrCreateConversation] Other user found: ${otherUser.role} (${otherUser.firstName} ${otherUser.lastName})`);

    // Check if conversation already exists (order-independent check using $all)
    // Use simple $all query without $expr to avoid any potential issues
    let conversation = null;
    try {
      conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, otherUserId] }
      }).populate('participants', 'firstName lastName email role');
      
      // Verify it has exactly 2 participants
      if (conversation) {
        // Check participant count manually
        const participantCount = Array.isArray(conversation.participants) 
          ? conversation.participants.length 
          : (conversation.participants ? 1 : 0);
        
        if (participantCount !== 2) {
          console.warn(`[getOrCreateConversation] Found conversation with invalid participant count: ${participantCount}, ignoring`);
          conversation = null;
        }
      }
    } catch (findError) {
      console.error(`[getOrCreateConversation] Error finding existing conversation:`, findError.message);
      // Continue to create new conversation
      conversation = null;
    }

    if (!conversation) {
      console.log(`[getOrCreateConversation] No existing conversation found. Creating new one between ${currentUserId} and ${otherUserId}`);
      
      // Ensure both IDs are ObjectIds
      const currentUserObjId = mongoose.Types.ObjectId.isValid(currentUserId) 
        ? new mongoose.Types.ObjectId(currentUserId) 
        : currentUserId;
      const otherUserObjId = mongoose.Types.ObjectId.isValid(otherUserId) 
        ? new mongoose.Types.ObjectId(otherUserId) 
        : otherUserId;
      
      // Use a retry mechanism to handle race conditions
      let retries = 3;
      let lastError = null;
      
      while (retries > 0 && !conversation) {
        try {
          const unreadCountObj = {};
          unreadCountObj[currentUserObjId.toString()] = 0;
          unreadCountObj[otherUserObjId.toString()] = 0;
          
          console.log(`[getOrCreateConversation] Attempting to create conversation (retries left: ${retries})`);
          
          // Use native MongoDB insertOne to completely bypass Mongoose and avoid findAndModify
          // This is the only way to avoid the "participants matched twice" error
          const conversationData = {
            participants: [currentUserObjId, otherUserObjId],
            unreadCount: unreadCountObj,
            lastMessage: '',
            lastMessageTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Ensure database connection is ready
          if (!mongoose.connection.db) {
            throw new Error('Database connection not ready');
          }
          
          // Use native MongoDB collection.insertOne to avoid any Mongoose operations
          // This completely bypasses Mongoose hooks and findAndModify
          const db = mongoose.connection.db;
          const collectionName = Conversation.collection.name;
          const conversationsCollection = db.collection(collectionName);
          
          console.log(`[getOrCreateConversation] Using native MongoDB insertOne on collection: ${collectionName}`);
          const result = await conversationsCollection.insertOne(conversationData);
          
          console.log(`[getOrCreateConversation] Native insert successful, insertedId: ${result.insertedId}`);
          
          // Wait a moment for the insert to be fully committed
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Fetch it back using findOne with the native collection first to avoid any Mongoose hooks
          const rawDoc = await conversationsCollection.findOne({ _id: result.insertedId });
          
          if (!rawDoc) {
            throw new Error('Failed to retrieve created conversation');
          }
          
          // Now convert to Mongoose document and populate
          conversation = await Conversation.findById(result.insertedId)
            .populate('participants', 'firstName lastName email role');
            
          if (!conversation) {
            // Fallback: create Mongoose document from raw data
            conversation = new Conversation(rawDoc);
            await conversation.populate('participants', 'firstName lastName email role');
          }
          
          console.log(`[getOrCreateConversation] Conversation created successfully: ${conversation._id}`);
          
        } catch (createErr) {
          lastError = createErr;
          console.error(`[getOrCreateConversation] Error creating conversation:`, createErr.message);
          console.error(`[getOrCreateConversation] Error code:`, createErr.code);
          console.error(`[getOrCreateConversation] Error name:`, createErr.name);
          
          // Check if it's a duplicate/race condition error
          const isDuplicateError = createErr.code === 11000 || 
                                  createErr.message?.includes('duplicate key') ||
                                  createErr.message?.includes('E11000') ||
                                  createErr.message?.includes('participants') ||
                                  createErr.message?.includes('findAndModify') ||
                                  createErr.message?.includes('matched twice');
          
          if (isDuplicateError) {
            console.log(`[getOrCreateConversation] Duplicate/race condition detected. Waiting and retrying...`);
            // Wait a bit for the other request to complete
            await new Promise(resolve => setTimeout(resolve, 200 * (4 - retries)));
            
            // Try to find the conversation that might have been created by another request
            conversation = await Conversation.findOne({
              participants: { $all: [currentUserObjId, otherUserObjId] },
              $expr: { $eq: [{ $size: "$participants" }, 2] }
            }).populate('participants', 'firstName lastName email role');
            
            if (conversation && conversation.participants && conversation.participants.length === 2) {
              console.log(`[getOrCreateConversation] Found existing conversation after retry: ${conversation._id}`);
              break; // Successfully found conversation
            }
          } else {
            // Not a duplicate error, throw it
            console.error(`[getOrCreateConversation] Non-duplicate error, throwing:`, createErr);
            throw createErr;
          }
          
          retries--;
        }
      }
      
      // If we still don't have a conversation after retries, throw error
      if (!conversation) {
        console.error(`[getOrCreateConversation] Failed to create or find conversation after retries`);
        throw lastError || new Error('Failed to create conversation');
      }
    } else {
      console.log(`[getOrCreateConversation] Existing conversation found: ${conversation._id}`);
    }

    // Always populate participants before sending response (ensure they're fully populated)
    if (!conversation || !conversation._id) {
      console.error(`[getOrCreateConversation] Conversation is null or invalid after creation/lookup`);
      return res.status(500).json({ message: 'Failed to create or retrieve conversation' });
    }
    
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName email role');

    // Final validation
    if (!conversation) {
      console.error(`[getOrCreateConversation] Conversation is null after population`);
      return res.status(500).json({ message: 'Failed to populate conversation data' });
    }
    
    if (!conversation.participants || conversation.participants.length !== 2) {
      console.error(`[getOrCreateConversation] Invalid participants count: ${conversation.participants?.length || 0}`);
      return res.status(500).json({ message: 'Conversation has invalid participants' });
    }

    // Validate that current user can chat with other user (role-based permission check)
    const currentUserRole = req.user.role;
    const otherUserRole = otherUser.role;
    let canChat = false;

    console.log(`[getOrCreateConversation] Checking permissions: ${currentUserRole} -> ${otherUserRole}`);

    // Admin can chat with manager
    if (currentUserRole === 'admin' && otherUserRole === 'manager') {
      canChat = true;
    } 
    // Manager can chat with admin, housekeeping, receptionist, and guest
    else if (currentUserRole === 'manager' && ['admin', 'housekeeping', 'receptionist', 'guest'].includes(otherUserRole)) {
      canChat = true;
      console.log(`[getOrCreateConversation] Manager can chat with ${otherUserRole}: ALLOWED`);
    } 
    // Guest can chat with receptionist
    else if (currentUserRole === 'guest' && otherUserRole === 'receptionist') {
      canChat = true;
    } 
    // Receptionist can chat with manager, guest, housekeeping, and admin
    else if (currentUserRole === 'receptionist' && ['manager', 'guest', 'housekeeping', 'admin'].includes(otherUserRole)) {
      canChat = true;
    } 
    // Housekeeping can chat with manager and receptionist
    else if (currentUserRole === 'housekeeping' && ['manager', 'receptionist'].includes(otherUserRole)) {
      canChat = true;
    }

    if (!canChat) {
      console.error(`[getOrCreateConversation] Permission denied: ${currentUserRole} cannot chat with ${otherUserRole}`);
      return res.status(403).json({ message: `You don't have permission to chat with ${otherUserRole} users` });
    }

    console.log(`[getOrCreateConversation] Permission check passed: ${currentUserRole} can chat with ${otherUserRole}`);

    console.log(`[getOrCreateConversation] Success! Conversation ID: ${conversation._id}, Participants: ${conversation.participants?.length || 0}`);
    
    // Ensure conversation is properly populated before sending
    if (!conversation.participants || conversation.participants.length === 0) {
      console.error('[getOrCreateConversation] Conversation has no participants after creation');
      return res.status(500).json({ message: 'Conversation created but participants not found' });
    }
    
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('[getOrCreateConversation] Error getting conversation:', error);
    console.error('[getOrCreateConversation] Error name:', error.name);
    console.error('[getOrCreateConversation] Error message:', error.message);
    console.error('[getOrCreateConversation] Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Error getting conversation';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + error.message;
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid ID format';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage, 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'firstName lastName email role')
      .sort({ lastMessageTime: -1 });

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: userId,
          isRead: false
        });

        // Get other participant
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        return {
          ...conv.toObject(),
          unreadCount,
          otherParticipant
        };
      })
    );

    res.json({ success: true, conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Error getting conversations', error: error.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'firstName lastName role')
      .populate('receiverId', 'firstName lastName role')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Error getting messages', error: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, message } = req.body;
    const senderId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    let conversation;

    let finalReceiverId;

    if (conversationId) {
      // Existing conversation - populate participants to ensure we can extract receiver
      conversation = await Conversation.findById(conversationId)
        .populate('participants', '_id');
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if sender is part of conversation
      const senderInConversation = conversation.participants.some(
        p => {
          const participantId = p._id ? p._id.toString() : p.toString();
          return participantId === senderId.toString();
        }
      );
      if (!senderInConversation) {
        return res.status(403).json({ message: 'Access denied - you are not part of this conversation' });
      }

      // Get receiver ID from participants
      // Handle both ObjectId and populated user objects
      const receiver = conversation.participants.find(
        p => {
          const participantId = p._id ? p._id.toString() : p.toString();
          return participantId !== senderId.toString();
        }
      );
      
      // Extract ID from receiver (could be ObjectId or populated object)
      if (receiver) {
        finalReceiverId = receiver._id ? receiver._id : receiver;
        console.log(`[sendMessage] Found receiver in participants:`, finalReceiverId);
      } else if (receiverId) {
        // Use provided receiverId as fallback
        finalReceiverId = receiverId;
        console.log(`[sendMessage] Using provided receiverId:`, finalReceiverId);
      } else {
        console.error(`[sendMessage] Receiver not found in conversation. Participants:`, conversation.participants);
        console.error(`[sendMessage] Sender ID:`, senderId);
        return res.status(400).json({ message: 'Receiver ID not found in conversation. Please try again.' });
      }
      
      // Ensure finalReceiverId is ObjectId (not string)
      if (typeof finalReceiverId === 'string') {
        try {
          finalReceiverId = new mongoose.Types.ObjectId(finalReceiverId);
        } catch (err) {
          console.error(`[sendMessage] Invalid receiverId format: ${finalReceiverId}`);
          return res.status(400).json({ message: 'Invalid receiver ID format' });
        }
      } else if (finalReceiverId && finalReceiverId._id) {
        finalReceiverId = finalReceiverId._id;
      }
      
      console.log(`[sendMessage] Using conversationId. Sender: ${senderId}, Receiver: ${finalReceiverId}`);
    } else if (receiverId) {
      // New conversation or find existing (order-independent check)
      // Use $all operator to avoid "participants matched twice" error
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
        $expr: { $eq: [{ $size: "$participants" }, 2] }
      });

      if (!conversation) {
        // Create new conversation - use create instead of findOneAndUpdate to avoid "participants matched twice" error
        try {
          const unreadCountObj = {
            [senderId.toString()]: 0,
            [receiverId.toString()]: 0
          };
          
          // Create the conversation directly
          conversation = await Conversation.create({
            participants: [senderId, receiverId],
            unreadCount: unreadCountObj,
            lastMessage: '',
            lastMessageTime: new Date()
          });
          
          console.log(`[sendMessage] New conversation created: ${conversation._id}`);
        } catch (createError) {
          // Handle duplicate key error - conversation might have been created by another request
          const isDuplicateError = createError.code === 11000 || 
                                  createError.message?.includes('duplicate key') ||
                                  createError.message?.includes('E11000') ||
                                  createError.message?.includes('participants');
          
          if (isDuplicateError) {
            console.log(`[sendMessage] Duplicate detected - finding existing conversation`);
            // Wait a bit for the other request to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Try to find the conversation that was just created
            conversation = await Conversation.findOne({
              participants: { $all: [senderId, receiverId] }
            });
            
            if (!conversation) {
              console.error(`[sendMessage] Could not find conversation after duplicate error`);
              throw createError;
            }
            console.log(`[sendMessage] Found existing conversation: ${conversation._id}`);
          } else {
            console.error(`[sendMessage] Error creating conversation:`, createError);
            throw createError;
          }
        }
      }
      
      // Convert receiverId to ObjectId if it's a string
      if (typeof receiverId === 'string') {
        try {
          finalReceiverId = new mongoose.Types.ObjectId(receiverId);
        } catch (err) {
          console.error(`[sendMessage] Invalid receiverId format: ${receiverId}`);
          return res.status(400).json({ message: 'Invalid receiver ID format' });
        }
      } else {
        finalReceiverId = receiverId;
      }
      
      console.log(`[sendMessage] Using receiverId. Sender: ${senderId}, Receiver: ${finalReceiverId}`);
    } else {
      return res.status(400).json({ message: 'Either conversationId or receiverId is required' });
    }

    // Validate receiver exists
    if (!finalReceiverId) {
      console.error(`[sendMessage] Receiver ID is missing. ConversationId: ${conversationId}, ReceiverId: ${receiverId}`);
      return res.status(400).json({ message: 'Receiver ID not found. Please try again.' });
    }

    // Convert to ObjectId if it's a string
    let receiverObjectId = finalReceiverId;
    if (typeof finalReceiverId === 'string') {
      try {
        receiverObjectId = new mongoose.Types.ObjectId(finalReceiverId);
      } catch (err) {
        console.error(`[sendMessage] Invalid receiver ID format: ${finalReceiverId}`);
        return res.status(400).json({ message: 'Invalid receiver ID format' });
      }
    }

    // Validate receiver exists in database and is active
    const receiver = await User.findById(receiverObjectId);
    if (!receiver) {
      console.error(`[sendMessage] Receiver not found in database: ${receiverObjectId}`);
      return res.status(404).json({ message: 'Receiver not found' });
    }
    if (!receiver.isActive) {
      return res.status(403).json({ message: 'Cannot send message to inactive user' });
    }

    // Permission check: Verify sender can chat with receiver
    const sender = req.user;
    const senderRole = sender.role;
    const receiverRole = receiver.role;
    let canChat = false;

    console.log(`[sendMessage] Checking permissions: ${senderRole} -> ${receiverRole}`);

    // Same permission logic as getOrCreateConversation
    if (senderRole === 'admin' && receiverRole === 'manager') {
      canChat = true;
    } else if (senderRole === 'manager' && ['admin', 'housekeeping', 'receptionist', 'guest'].includes(receiverRole)) {
      canChat = true;
    } else if (senderRole === 'guest' && receiverRole === 'receptionist') {
      canChat = true;
    } else if (senderRole === 'receptionist' && ['manager', 'guest', 'housekeeping', 'admin'].includes(receiverRole)) {
      canChat = true;
    } else if (senderRole === 'housekeeping' && ['manager', 'receptionist'].includes(receiverRole)) {
      canChat = true;
    }

    if (!canChat) {
      console.error(`[sendMessage] Permission denied: ${senderRole} cannot chat with ${receiverRole}`);
      return res.status(403).json({ message: `You don't have permission to chat with ${receiverRole} users` });
    }

    console.log(`[sendMessage] Permission check passed. Sender: ${sender.firstName} (${senderRole}), Receiver: ${receiver.firstName} (${receiverRole})`);
    
    // Use the ObjectId version
    finalReceiverId = receiverObjectId;

    // Create message
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId: finalReceiverId,
      message: message.trim()
    });

    // Update conversation
    conversation.lastMessage = message.trim();
    conversation.lastMessageTime = new Date();
    
    // Update unread count (Mongoose Map type)
    const receiverIdStr = finalReceiverId.toString();
    if (!conversation.unreadCount) {
      conversation.unreadCount = new Map();
    }
    // Mongoose Map supports .get() and .set() methods
    const currentUnread = conversation.unreadCount.get(receiverIdStr) || 0;
    conversation.unreadCount.set(receiverIdStr, currentUnread + 1);
    conversation.markModified('unreadCount'); // Mark as modified for Mongoose
    
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'firstName lastName role')
      .populate('receiverId', 'firstName lastName role');

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// @desc    Get users that current user can chat with
// @route   GET /api/messages/users
// @access  Private
exports.getChattableUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    const currentRole = currentUser.role;
    let allowedRoles = [];

    // Define who can chat with whom
    if (currentRole === 'admin') {
      allowedRoles = ['manager'];
    } else if (currentRole === 'manager') {
      // Manager can chat with admin, housekeeping, receptionist, and guest
      allowedRoles = ['admin', 'housekeeping', 'receptionist', 'guest'];
    } else if (currentRole === 'guest') {
      allowedRoles = ['receptionist'];
    } else if (currentRole === 'receptionist') {
      // Receptionist can chat with manager, guest, housekeeping, and admin
      allowedRoles = ['manager', 'guest', 'housekeeping', 'admin'];
    } else if (currentRole === 'housekeeping') {
      allowedRoles = ['manager', 'receptionist'];
    }

    const users = await User.find({
      role: { $in: allowedRoles },
      _id: { $ne: currentUser._id },
      isActive: true  // Only show active users
    }).select('firstName lastName email role').sort({ firstName: 1, lastName: 1 });

    console.log(`[getChattableUsers] Current user: ${currentUser.role} (${currentUser._id})`);
    console.log(`[getChattableUsers] Allowed roles: ${allowedRoles.join(', ')}`);
    console.log(`[getChattableUsers] Found ${users.length} users:`, users.map(u => `${u.firstName} ${u.lastName} (${u.role})`));

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting chattable users:', error);
    res.status(500).json({ message: 'Error getting users', error: error.message });
  }
};



