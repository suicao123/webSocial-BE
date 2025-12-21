const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMidleware = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

router.get('/', usersController.getUser);
router.get('/getFriends/:id', authMidleware, usersController.getFriends);
router.get('/getReceivedFriendRequests', authMidleware, usersController.getReceivedFriendRequests);
router.get('/getNonFriends', authMidleware, usersController.getNonFriends);
router.post('/sendFriendRequest', authMidleware, usersController.sendFriendRequest);
router.post('/cancelFriendRequest', authMidleware, usersController.cancelFriendRequest);
router.post('/uploadAvatarProfile', authMidleware,  uploadAvatar.single('avatar'), usersController.uploadAvatarProfile);
router.post('/acceptFriendRequest', authMidleware, usersController.acceptFriendRequest);
router.delete('/unfriend/:user_id', authMidleware, usersController.unfriend);
router.put('/updateProfile', authMidleware, usersController.updateProfile);

router.get('/getFriendshipStatus/:user_id', authMidleware, usersController.getFriendshipStatus);

module.exports = router