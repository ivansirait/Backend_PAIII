import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { prisma } from './config/db.js';

// Import routes
import laporanRoutes from './routes/laporanRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import postRoutes from './routes/postRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import Admin_supirRoutes from './routes/Admin_supirRoutes.js';
import supirOperasionalRoutes from './routes/supirOperasionalRoutes.js';
import trukRoutes from './routes/trukRoutes.js';
import wilayahRoutes from './routes/wilayahRoutes.js';
import penugasanRoutes from './routes/penugasanRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ← TAMBAHAN: parsing form data

// ✅ Serve static files (gambar upload)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ✅ BigInt fix untuk JSON.stringify
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

// ✅ Semua routes dikumpulkan di satu tempat (bukan sebagian di atas, sebagian di bawah)
app.get('/', (req: Request, res: Response) => res.send('🚀 Server CleanCity OK!'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/supir', Admin_supirRoutes);
app.use('/api/admin/truks', trukRoutes);
app.use('/api/wilayah', wilayahRoutes);
app.use('/api/admin/wilayah', wilayahRoutes);
app.use('/api/supir-op', supirOperasionalRoutes);
app.use('/api/penugasan', penugasanRoutes);

// ✅ Backward compatibility
app.use('/api/auth/posts', postRoutes);
app.use('/api/auth/galleries', galleryRoutes);

// ✅ 404 handler untuk route yang tidak ditemukan
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} tidak ditemukan` });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server nyala di http://localhost:${PORT}`);
});

export default app;