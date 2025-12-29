const express = require('express');
const router = express.Router();
const loginController = require('../controllers/login.controller');

router.post('/', loginController.authLogin);
router.post('/register', loginController.register);

module.exports = router;
