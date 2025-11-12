const express = require('express');
const router = express.Router();
const postController = require('../controllers/posts.controller');
const upload = require('../middleware/upload.middleware');
const authMidleware = require('../middleware/auth.middleware');

router.get('/', authMidleware, postController.getPost);
router.post('/create', authMidleware, postController.createPost);
router.post('/uploadImg', authMidleware,  upload.array('images', 10), postController.uploadImage);
router.get('/comment', authMidleware, postController.getComment);
router.post('/createComment', authMidleware, postController.createComment);

router.post('/createLike/:id', authMidleware, postController.createLike);
router.delete('/delete/:id', authMidleware, postController.deletePost);

module.exports = router;
