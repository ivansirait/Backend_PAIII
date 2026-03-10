import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Hitung semua laporan
    const totalLaporan = await prisma.report.count();
    
    // 2. Hitung berdasarkan status
    const laporanSelesai = await prisma.report.count({
      where: { status: 'SELESAI' }
    });
    
    const laporanDiproses = await prisma.report.count({
      where: { status: 'DITINDAKLANJUTI' }

      });
    
    const laporanPending = await prisma.report.count({
      where: { status: 'PENDING' }
    });

    const totalTruk = await prisma.truck.count();
    const trukAktif = await prisma.truck.count({
      where: { status: 'AVAILABLE' }
    });

    // 4. Data grafik 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const laporanPerHari = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as tanggal,
        COUNT(*) as total
      FROM reports
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY tanggal ASC
    `;

    // 5. Kinerja per wilayah (contoh dengan location_id)
    const kinerjaWilayah = await prisma.report.groupBy({
      by: ['locationId'],
      where: { status: 'SELESAI' },
      _count: true
    });

    res.json({
      success: true,
      data: {
        cards: {
          totalLaporan,
          laporanSelesai,
          laporanDiproses,
          laporanPending,
          totalTruk,
          trukAktif
        },
        grafik: laporanPerHari,
        kinerjaWilayah
      }
    });

  } catch (error) {
    console.error('Error dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};