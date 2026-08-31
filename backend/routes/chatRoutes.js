/**
 * Chat & Messaging Routes
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/conversations', authenticateToken, chatController.getConversations);
router.get('/conversations/:partnerId/messages', authenticateToken, chatController.getMessages);
router.get('/chat/messages', authenticateToken, chatController.getMessages);
router.post('/chat/messages', authenticateToken, chatController.sendMessage);
router.post('/chat/reactions', authenticateToken, chatController.toggleReaction);

module.exports = router;
