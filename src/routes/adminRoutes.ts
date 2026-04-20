import { Router } from 'express';
import { addOperator } from '../controllers/adminController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// 🔒 PROTEKSI: semua endpoint hanya untuk ADMIN yang sudah login
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

// Endpoint khusus Admin untuk menambah supir baru
router.post('/add-operator', addOperator);

export default router;