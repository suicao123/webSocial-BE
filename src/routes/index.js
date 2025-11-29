const express = require('express');
const router = express.Router();
const authRoute = require('./auth.route');
const postsRoute = require('./posts.route');
const usersRoute = require('./users.route');


router.use('/login', authRoute);
router.use('/posts', postsRoute);
router.use('/users', usersRoute);

module.exports = router;
