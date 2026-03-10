import { Router } from 'express';
import { 
  getAllSupir,
  getSupirById,
  createSupir,
  updateSupir,
  deleteSupir 
} from '../controllers/Admin_supirController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Semua route di sini hanya untuk ADMIN
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

// GET semua supir
router.get('/', getAllSupir);

// GET supir by ID
router.get('/:id', getSupirById);

// POST tambah supir baru
router.post('/', createSupir);

// PUT update supir
router.put('/:id', updateSupir);

// DELETE supir
router.delete('/:id', deleteSupir);

export default router;