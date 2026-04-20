import { Router } from 'express';
import {
	getLaporan,
	getLaporanById,
	createLaporan,
	updateStatus,
	deleteLaporan,
	selesaiLaporan,
	validateLaporanPhoto
} from '../controllers/laporanController.js';
import multer from 'multer';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024
	},
	fileFilter: (_req, file, cb) => {
		if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
			cb(new Error('Tipe file tidak didukung. Gunakan JPEG atau PNG.'));
			return;
		}

		cb(null, true);
	}
});

const handleUploadError = (handler: any) => (req: any, res: any, next: any) => {
	handler(req, res, (error: any) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
			res.status(400).json({
				success: false,
				status: 'failed_validation',
				message: 'Ukuran file terlalu besar. Maksimal 10MB.'
			});
			return;
		}

		res.status(400).json({
			success: false,
			status: 'failed_validation',
			message: error.message || 'Upload file gagal diproses.'
		});
	});
};

// PUBLIC: Get semua laporan
router.get('/', getLaporan);

// PUBLIC: Get laporan by ID (PWA: cek status laporan via ID)
router.get('/:id', getLaporanById);

// AUTH: Validasi foto ke ML service via backend utama
router.post(
	'/validate-photo',
	authenticateToken,
	handleUploadError(upload.single('image')),
	validateLaporanPhoto
);

// PUBLIC: Create laporan (tanpa login, GPS wajib)
router.post('/', handleUploadError(upload.single('photo')), createLaporan);

// ADMIN: Update status laporan
router.patch('/:id', authenticateToken, authorizeRole(['ADMIN']), updateStatus);

// ADMIN: Delete laporan
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteLaporan);

// SUPIR: Tandai laporan selesai + upload foto after
router.post(
	'/:id/selesai',
	authenticateToken,
	authorizeRole(['OPERATOR']),
	handleUploadError(upload.single('photoAfter')),
	selesaiLaporan
);

export default router;  