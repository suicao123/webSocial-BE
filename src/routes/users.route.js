const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMidleware = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

router.get('/', usersController.getUser);
router.get('/getUsersList', authMidleware, usersController.getUsersList);
// router.get('/getUsersListByName', authMidleware, usersController.getUsersListByName);
router.get('/getAdminsList', authMidleware, usersController.getAdminsList);
router.get('/getFriends/:id', authMidleware, usersController.getFriends);
router.get('/getReceivedFriendRequests', authMidleware, usersController.getReceivedFriendRequests);
router.get('/getNonFriends', authMidleware, usersController.getNonFriends);
router.get('/stats', authMidleware, usersController.getDashboardStats);
router.post('/sendFriendRequest', authMidleware, usersController.sendFriendRequest);
router.post('/cancelFriendRequest', authMidleware, usersController.cancelFriendRequest);
router.post('/uploadAvatarProfile', authMidleware,  uploadAvatar.single('avatar'), usersController.uploadAvatarProfile);
router.post('/acceptFriendRequest', authMidleware, usersController.acceptFriendRequest);
router.delete('/unfriend/:user_id', authMidleware, usersController.unfriend);
router.delete('/deleteUser/:id', authMidleware, usersController.deleteUser);
router.put('/updateProfile', authMidleware, usersController.updateProfile);

router.get('/getFriendshipStatus/:user_id', authMidleware, usersController.getFriendshipStatus);

module.exports = router