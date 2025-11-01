const express = require('express');
const router = express.Router();
const authRoute = require('./auth.route');
const postsRoute = require('./posts.route');


router.use('/login', authRoute);
router.use('/posts', postsRoute);

module.exports = router;
