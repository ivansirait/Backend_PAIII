import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/login', login);
router.post('/register', register);

// ============================================
// PROTECTED ROUTES (Semua role)
// ============================================
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Data profile',
    data: {
      id: req.user?.id,        // <-- BISA! TypeScript tahu
      email: req.user?.email,
      role: req.user?.role,
      fullName: req.user?.fullName
    }
  });
});

// ============================================
// ROLE-SPECIFIC ROUTES
// ============================================
router.get('/admin-only', 
  authenticateToken, 
  authorizeRole(['ADMIN']), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Anda adalah admin',
      data: req.user   // <-- BISA!
    });
  }
);

router.get('/supir-only', 
  authenticateToken, 
  authorizeRole(['OPERATOR']), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Anda adalah supir',
      data: req.user
    });
  }
);

router.get('/warga-only', 
  authenticateToken, 
  authorizeRole(['WARGA']), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Anda adalah warga',
      data: req.user
    });
  }
);

// Route untuk staff DLH (admin + supir)
router.get('/staff-only', 
  authenticateToken, 
  authorizeRole(['ADMIN', 'OPERATOR']), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Anda adalah staff DLH',
      data: req.user
    });
  }
);

export default router;