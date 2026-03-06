import { Router } from 'express';
import { getGalleries, getGalleryById, createGallery, deleteGallery } from '../controllers/galleryController.js';

const router = Router();

router.get('/', getGalleries);
router.get('/:id', getGalleryById);
router.post('/', createGallery);
router.delete('/:id', deleteGallery);

export default router;
