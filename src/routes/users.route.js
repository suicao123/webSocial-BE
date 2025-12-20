const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMidleware = require('../middleware/auth.middleware');

router.get('/', usersController.getUser);
router.get('/getFriends/:id', authMidleware, usersController.getFriends);
router.get('/getReceivedFriendRequests', authMidleware, usersController.getReceivedFriendRequests);
router.get('/getNonFriends', authMidleware, usersController.getNonFriends);
router.post('/sendFriendRequest', authMidleware, usersController.sendFriendRequest);
router.post('/cancelFriendRequest', authMidleware, usersController.cancelFriendRequest);
router.post('/acceptFriendRequest', authMidleware, usersController.acceptFriendRequest);

module.exports = router