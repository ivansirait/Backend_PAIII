import { Router } from 'express';
import { 
  getAllPenugasan,
  getPenugasanById,
  createPenugasanDariAduan,
  // createPenugasanRutin,
  updatePenugasan,
  deletePenugasan,
  getDaftarSupir,
  getDaftarTruk
} from '../controllers/penugasanController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Semua route penugasan hanya untuk ADMIN
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

// GET daftar supir & truk untuk dropdown
router.get('/supir', getDaftarSupir);
router.get('/truk', getDaftarTruk);

// CRUD Penugasan
router.get('/', getAllPenugasan);
router.get('/:id', getPenugasanById);
router.post('/aduan', createPenugasanDariAduan);
// router.post('/rutin', createPenugasanRutin);
router.put('/:id', updatePenugasan);
router.delete('/:id', deletePenugasan);

// 🔴 PASTIKAN INI ADA
export default router;