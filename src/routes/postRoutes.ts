import express from 'express';
import { getAllPosts, createPost, updatePost, deletePost, upload } from '../controllers/postController.js';

const router = express.Router();

router.get('/', getAllPosts);
router.post('/', upload.single('image'), createPost);    // ← multer di sini
router.put('/:id', upload.single('image'), updatePost); // ← multer di sini
router.delete('/:id', deletePost);

export default router;