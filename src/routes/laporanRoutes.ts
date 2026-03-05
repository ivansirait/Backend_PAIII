import { Router } from 'express';
import { getLaporan, createLaporan, updateStatus, deleteLaporan,   selesaiLaporan } from '../controllers/laporanController.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getLaporan);
router.post('/', upload.single('photo'), createLaporan);
router.patch('/:id', updateStatus);
router.delete('/:id', deleteLaporan);
router.post('/:id/selesai', upload.single('photoAfter'), selesaiLaporan);
export default router;  