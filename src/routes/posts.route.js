const express = require('express');
const router = express.Router();
const postController = require('../controllers/posts.controller');
const upload = require('../middleware/upload.middleware');
const authMidleware = require('../middleware/auth.middleware');

router.get('/', postController.getPost);
router.post('/create', postController.createPost);
router.delete('/delete/:id', postController.deletePost);
router.post('/uploadImg', authMidleware,  upload.array('images', 10), postController.uploadImage);

module.exports = router;
