
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaClient, Category } from '@prisma/client'; // Tambahkan Category di sini
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('🌱 Memulai proses Seeding...');
  const hashedPassword = await bcrypt.hash('sampah123', 10);
  const hashedPassword = await bcrypt.hash('sampah123', 10);
  // Buat Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dlh.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@dlh.com',
      fullName: 'Administrator DLH',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Buat Supir contoh
  const supir1 = await prisma.user.upsert({
    where: { email: 'supir1@dlh.com' },
    update: {},
    create: {
      email: 'supir1@dlh.com',
      fullName: 'Budi Supir',
      passwordHash: hashedPassword,
      role: 'OPERATOR',
      isActive: true,
    },
  });
  console.log('✅ Supir 1 berhasil dibuat: supir1@dlh.com');

  const supir2 = await prisma.user.upsert({
    where: { email: 'supir2@dlh.com' },
    update: {},
    create: {
      email: 'supir2@dlh.com',
      fullName: 'Andi Supir',
      passwordHash: hashedPassword,
      role: 'OPERATOR',
      isActive: true,
    },
  });
  console.log('✅ Supir 2 berhasil dibuat: supir2@dlh.com');

  // Buat contoh Berita dengan slug UNIK
  console.log('📝 Membuat contoh berita...');
  
  // Gunakan createMany dengan skipDuplicates, atau buat satu per satu
  await prisma.post.createMany({
    data: [
      {
        title: 'Jadwal Baru Pengangkutan Sampah',
        slug: 'jadwal-baru-2026', // UNIK
        content: 'Mulai Maret 2026, armada akan beroperasi mulai pukul 05.00 WIB hingga 18.00 WIB. Jumat libur untuk gotong royong.',
        category: 'PENGUMUMAN',
        isPublished: true,
        authorId: admin.id,
      },
      {
        title: 'Tips Memilah Sampah Organik di Rumah',
        slug: 'tips-pilah-sampah', // UNIK (berbeda)
        content: 'Pisahkan sampah organik (sisa makanan, daun) dan non-organik (plastik, botol). Sampah organik bisa diolah menjadi kompos.',
        category: 'BERITA',
        isPublished: true,
        authorId: admin.id,
      },
    ],
    skipDuplicates: true, // Lewati jika slug sudah ada
  });
  console.log('✅ Sample posts created');

  // Buat contoh galeri
  console.log('🖼️ Membuat contoh galeri...');
  await prisma.gallery.createMany({
    data: [
      {
        title: 'Kegiatan Gotong Royong',
        imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=300',
        isSlider: true,
        description: 'Warga bergotong royong membersihkan lingkungan',
      },
      {
        title: 'Pengangkutan Sampah',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=300',
        isSlider: true,
        description: 'Petugas mengangkut sampah di wilayah Balige',
      },
      {
        title: 'Edukasi Pemilahan Sampah',
        imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=300',
        isSlider: false,
        description: 'Sosialisasi pemilahan sampah kepada masyarakat',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Sample galleries created');

  // Buat contoh lokasi (kecamatan)
// Buat contoh lokasi (kecamatan) dengan code unik
console.log('🗺️ Membuat data kecamatan...');
const kecamatanList = [
  { code: 'BLG', name: 'Balige', locationType: 'KECAMATAN', latitude: 2.3333, longitude: 99.0667, isActive: true },
  { code: 'LGB', name: 'Laguboti', locationType: 'KECAMATAN', latitude: 2.3500, longitude: 99.1500, isActive: true },
  { code: 'PRS', name: 'Porsea', locationType: 'KECAMATAN', latitude: 2.4333, longitude: 99.1667, isActive: true },
  { code: 'AJB', name: 'Ajibata', locationType: 'KECAMATAN', latitude: 2.6000, longitude: 98.9500, isActive: true },
  { code: 'LBJ', name: 'Lumban Julu', locationType: 'KECAMATAN', latitude: 2.5833, longitude: 99.0667, isActive: true },
  { code: 'ULN', name: 'Uluan', locationType: 'KECAMATAN', latitude: 2.5333, longitude: 99.1333, isActive: true },
  { code: 'SGP', name: 'Sigumpar', locationType: 'KECAMATAN', latitude: 2.3833, longitude: 99.1500, isActive: true },
  { code: 'SLN', name: 'Silaen', locationType: 'KECAMATAN', latitude: 2.4833, longitude: 99.2500, isActive: true },
  { code: 'NSS', name: 'Nassau', locationType: 'KECAMATAN', latitude: 2.3167, longitude: 99.4000, isActive: true },
];

for (const kec of kecamatanList) {
  await prisma.location.upsert({
    where: { 
      code: kec.code // Gunakan code yang unik
    },
    update: {}, // Tidak update apapun jika sudah ada
    create: {
      code: kec.code,
      name: kec.name,
      locationType: kec.locationType,
      latitude: kec.latitude,
      longitude: kec.longitude,
      isActive: kec.isActive,
    },
  });
}
console.log('✅ Data kecamatan created');

  console.log('🌱 Seeding selesai!');
  // TENTUKAN TIPENYA DI SINI AGAR TIDAK ERROR (as { ... }[])
  const posts = [
    {
      title: 'Pengumuman Jadwal Baru Pengangkutan',
      slug: 'jadwal-baru-2026',
      content: 'Mulai Maret 2026, armada akan beroperasi mulai pukul 05.00 WIB...',
      category: Category.PENGUMUMAN, // Gunakan Enum Category
      isPublished: true,
      isFeatured: true,
      authorId: admin.id,
    },
    {
      title: 'Tips Memilah Sampah Organik di Rumah',
      slug: 'tips-pilah-sampah',
      content: 'Memilah sampah dari rumah membantu mempercepat proses pengolahan di TPA...',
      category: Category.BERITA, // Gunakan Enum Category
      isPublished: true,
      isFeatured: false,
      authorId: admin.id,
    }
  ];

  console.log('⏳ Menyinkronkan data berita...');

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        content: post.content,
        category: post.category, // Sekarang TypeScript sudah tahu ini Enum
        isPublished: post.isPublished,
        isFeatured: post.isFeatured,
        authorId: post.authorId,
      },
      create: post,
    });
  }

  console.log('✅ Seeding Selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });