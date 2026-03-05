import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { getAllPosts, createPost, deletePost } from '../controllers/postController.js';
import { getAllGalleries, createGallery, deleteGallery } from '../controllers/galleryController.js';
import { authenticateToken } from '../middleware/auth.js'; // Import middleware

const router = Router();

// Public routes
router.post('/login', login);
router.get('/posts', getAllPosts);
router.get('/galleries', getAllGalleries);

// Protected routes (perlu token)
router.post('/posts', authenticateToken, createPost);
router.delete('/posts/:id', authenticateToken, deletePost);
router.post('/galleries', authenticateToken, createGallery);
router.delete('/galleries/:id', authenticateToken, deleteGallery);

export default router;