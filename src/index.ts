import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // TAMBAHKAN INI
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

app.use(cors());
app.use(express.json());

// Serve static files from uploads directory - PENTING UNTUK MENGAKSES GAMBAR
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/upload', uploadRoutes); // TAMBAHKAN ROUTE UPLOAD

// Untuk backward compatibility dengan endpoint /api/auth/posts
app.use('/api/auth/posts', postRoutes);
app.use('/api/auth/galleries', galleryRoutes); // TAMBAHKAN JUGA UNTUK GALLERIES

// Prototype BigInt agar tidak error saat JSON.stringify
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

// // Seeding Otomatis User Default
// const seedUser = async () => {
//   try {
//     const user = await prisma.user.findUnique({ where: { id: BigInt(1) } });
//     if (!user) {
//       await prisma.user.create({
//         data: {
//           id: BigInt(1),
//           email: "admin@cleancity.com",
//           fullName: "Sistem CleanCity",
//           passwordHash: "hashed",
//           role: "ADMIN"
//         }
//       });
//       console.log("✅ User Default OK");
//     }
//   } catch (e) { 
//     console.log("Seeding skipped:", e); 
//   }
// };
// seedUser();

// Routes
app.get('/', (req, res) => res.send('🚀 Server CleanCity OK!'));

app.listen(PORT, () => {
  console.log(`🚀 Server nyala di http://localhost:${PORT}`);
  console.log(`📝 Endpoints available:`);
  console.log(`   - GET /api/posts`);
  console.log(`   - POST /api/posts`);
  console.log(`   - GET /api/posts/:id`);
  console.log(`   - GET /api/posts/slug/:slug`);
  console.log(`   - PUT /api/posts/:id`);
  console.log(`   - DELETE /api/posts/:id`);
  console.log(`   - GET /api/galleries`);
  console.log(`   - GET /api/galleries/slider`);
  console.log(`   - POST /api/galleries`);
  console.log(`   - PUT /api/galleries/:id`);
  console.log(`   - DELETE /api/galleries/:id`);
  console.log(`   - GET /api/laporan`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/upload - Untuk upload gambar`); // TAMBAHKAN INI
  console.log(`   - GET /uploads/[filename] - Untuk akses gambar`);
    console.log(`   - /api/admin/supir (Admin - CRUD data supir)`); // TAMBAHKAN INI
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/supir', Admin_supirRoutes); 

app.use('/api/admin/truks', trukRoutes);

app.use('/api/wilayah', wilayahRoutes);
app.use('/api/admin/wilayah', wilayahRoutes); 


app.use('/api/supir-op', supirOperasionalRoutes);

app.use('/api/penugasan', penugasanRoutes);