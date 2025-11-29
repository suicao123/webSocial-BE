const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMidleware = require('../middleware/auth.middleware');

router.get('/', usersController.getUser);
router.get('/getFriends/:id', usersController.getFriends);

module.exports = router