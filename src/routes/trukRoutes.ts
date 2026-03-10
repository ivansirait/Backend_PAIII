import { Router } from 'express';
import { 
  getAllTruk,
  getTrukById,
  createTruk,
  updateTruk,
  deleteTruk 
} from '../controllers/trukController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Semua route hanya untuk ADMIN
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/', getAllTruk);
router.get('/:id', getTrukById);
router.post('/', createTruk);
router.put('/:id', updateTruk);
router.delete('/:id', deleteTruk);

export default router;