import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // Tambahkan import ini

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('sampah123', 10); // Hash passwordnya

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dlh.com' },
    update: {},
    create: {
      email: 'admin@dlh.com',
      fullName: 'Administrator DLH',
      passwordHash: hashedPassword, // Simpan hasil hash
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ User Admin Berhasil Dibuat: admin@dlh.com');

  // 2. Buat Contoh Berita (Post) untuk Homepage
  await prisma.post.createMany({
    data: [
      {
        title: 'Pengumuman Jadwal Baru Pengangkutan',
        slug: 'jadwal-baru-2026',
        content: 'Mulai Maret 2026, armada akan beroperasi mulai pukul 05.00 WIB...',
        category: 'PENGUMUMAN',
        isPublished: true,
        isFeatured: true,
        authorId: admin.id,
      },
      {
        title: 'Tips Memilah Sampah Organik di Rumah',
        slug: 'tips-pilah-sampah',
        content: 'Memilah sampah dari rumah membantu mempercepat proses pengolahan di TPA...',
        category: 'BERITA',
        isPublished: true,
        authorId: admin.id,
      }
    ],
  });
  console.log('✅ Data Berita Awal Berhasil Dimasukkan');

  console.log('--- Seeding Selesai ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });