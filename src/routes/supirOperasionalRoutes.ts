import { Router } from 'express';
import { 
  getDashboard,
  getTugasHarian,
  getTugasAduan,
  getDetailTugas,
  updateStatusTugas,
  uploadFotoTugas,
  inputVolume,
  getRiwayatTugas,
  getProfil,
  updateLokasi
} from '../controllers/supirOperasionalController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🔐 Semua route ini untuk SUPIR (role: OPERATOR)
router.use(authenticateToken);
router.use(authorizeRole(['OPERATOR']));

// 📊 Dashboard
router.get('/dashboard', getDashboard);

// 📋 Tugas
router.get('/tugas/harian', getTugasHarian);
router.get('/tugas/aduan', getTugasAduan);        // 🔴 INI YANG DIPANGGIL FRONTEND
router.get('/tugas/:id', getDetailTugas);
router.patch('/tugas/:id/status', updateStatusTugas);
router.post('/tugas/:id/foto', upload.single('foto'), uploadFotoTugas);
router.post('/tugas/:id/volume', inputVolume);

// 📜 Riwayat
router.get('/riwayat', getRiwayatTugas);

// 👤 Profil
router.get('/profil', getProfil);

// 📍 Lokasi (live tracking)
router.post('/lokasi', updateLokasi);

export default router;