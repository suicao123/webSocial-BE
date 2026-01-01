const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMidleware = require('../middleware/auth.middleware');

router.post('/create', authMidleware, chatController.getOrCreateConversation);
router.post('/sendMessage', authMidleware, chatController.sendMessage);
router.delete('/deleteMessage/:id', authMidleware, chatController.deleteMessage);

router.get('/getMessages/:id', authMidleware, chatController.getMessages);

module.exports = router;