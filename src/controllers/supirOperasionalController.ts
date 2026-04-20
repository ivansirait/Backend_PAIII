import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma, supabase } from '../config/db.js';

const toBigIntParam = (value: string | string[] | undefined): bigint => {
  if (Array.isArray(value)) {
    return BigInt(value[0]);
  }

  if (!value) {
    throw new Error('ID tidak valid');
  }

  return BigInt(value);
};


// Helper untuk konversi BigInt
const bigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(bigIntToString);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, bigIntToString(value)])
    );
  }
  return obj;
};

// ==================== DASHBOARD ====================
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const supirId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ambil semua tugas hari ini
    const tasks = await prisma.task.findMany({
      where: {
        driverId: BigInt(String(supirId)),
        scheduledAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Hitung statistik
    const totalTugas = tasks.length;
    const tugasSelesai = tasks.filter(t => t.status === 'SELESAI').length;
    const tugasPending = tasks.filter(t => 
      ['DITUGASKAN', 'DITERIMA', 'DALAM_PERJALANAN', 'TIBA', 'BEKERJA'].includes(t.status)
    ).length;

    // Ambil notifikasi
    const notifications = await prisma.notification.findMany({
      where: {
        userId: BigInt(String(supirId)),
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      data: {
        statistik: {
          totalTugas,
          tugasSelesai,
          tugasPending,
          persentase: totalTugas ? Math.round((tugasSelesai / totalTugas) * 100) : 0
        },
        notifikasi: notifications.map(n => ({
          id: n.id.toString(),
          title: n.title,
          message: n.message,
          createdAt: n.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error dashboard:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil dashboard' });
  }
};

// ==================== TUGAS ADUAN ====================
export const getTugasAduan = async (req: Request, res: Response) => {
  try {
    const supirId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`Mencari tugas untuk supir ID: ${supirId}`);

    const tasks = await prisma.task.findMany({
      where: {
        driverId: BigInt(String(supirId)),
        type: 'ADUAN',
        scheduledAt: {
          gte: today,
          lt: tomorrow
        },
        // 🔴 AMBIL SEMUA TUGAS YANG BELUM SELESAI
        NOT: {
          status: 'SELESAI'
        }
      },
      include: {
        report: {
          include: {
            user: {
              select: {
                fullName: true,
                phoneNumber: true
              }
            }
          }
        },
        truck: {
          select: {
            plateNumber: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    console.log(`Ditemukan ${tasks.length} tugas`);

    const formattedTasks = tasks.map(task => ({
      id: task.id.toString(),
      taskNumber: task.taskNumber,
      lokasi: task.location,
      kecamatan: task.district,
      jadwal: task.scheduledAt,
      status: task.status,
      pelapor: task.report?.user?.fullName || 'Warga',
      deskripsi: task.report?.description || task.description,
      fotoLaporan: task.report?.photoUrl,
      jenisSampah: task.report?.jenisSampah,
      latitude: task.latitude.toString(),
      longitude: task.longitude.toString(),
      platTruk: task.truck?.plateNumber
    }));

    res.json({
      success: true,
      data: formattedTasks
    });

  } catch (error) {
    console.error('Error getTugasAduan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil tugas aduan' });
  }
};

// ==================== TUGAS HARIAN ====================
export const getTugasHarian = async (req: Request, res: Response) => {
  try {
    const supirId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        driverId: BigInt(supirId),
        type: 'RUTIN',
        scheduledAt: {
          gte: today,
          lt: tomorrow
        },
        NOT: {
          status: 'SELESAI'
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    const formattedTasks = tasks.map(task => ({
      id: task.id.toString(),
      taskNumber: task.taskNumber,
      lokasi: task.location,
      kecamatan: task.district,
      jadwal: task.scheduledAt,
      status: task.status,
      deskripsi: task.description,
      latitude: task.latitude.toString(),
      longitude: task.longitude.toString()
    }));

    res.json({
      success: true,
      data: formattedTasks
    });

  } catch (error) {
    console.error('Error getTugasHarian:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil tugas harian' });
  }
};

// ==================== DETAIL TUGAS ====================
export const getDetailTugas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supirId = (req as any).user.id;

    const task = await prisma.task.findFirst({
      where: {
        id: toBigIntParam(id),
        driverId: BigInt(String(supirId))
      },
      include: {
        report: {
          include: {
            user: {
              select: {
                fullName: true,
                phoneNumber: true
              }
            }
          }
        },
        truck: true,
        photos: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    }

    res.json({
      success: true,
      data: bigIntToString(task)
    });

  } catch (error) {
    console.error('Error getDetailTugas:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail tugas' });
  }
};

// ==================== UPDATE STATUS ====================
export const updateStatusTugas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const supirId = (req as any).user.id;

    const validStatus = ['DITERIMA', 'DALAM_PERJALANAN', 'TIBA', 'BEKERJA', 'SELESAI'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: toBigIntParam(id),
        driverId: BigInt(String(supirId))
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    }

    const updateData: any = { status };
    if (status === 'DITERIMA') updateData.startedAt = new Date();
    if (status === 'SELESAI') updateData.completedAt = new Date();

    const updatedTask = await prisma.task.update({
      where: { id: toBigIntParam(id) },
      data: updateData
    });

    // Buat notifikasi untuk admin
    await prisma.notification.create({
      data: {
        userId: task.assignerId,
        title: 'Status Tugas Diperbarui',
        message: `Tugas ${task.taskNumber} sekarang ${status}`,
        isRead: false
      }
    });

    res.json({
      success: true,
      message: 'Status berhasil diperbarui',
      data: bigIntToString(updatedTask)
    });

  } catch (error) {
    console.error('Error updateStatus:', error);
    res.status(500).json({ success: false, message: 'Gagal update status' });
  }
};

// ==================== UPLOAD FOTO ====================
export const uploadFotoTugas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const file = (req as any).file;
    const supirId = (req as any).user.id;

    if (!file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: toBigIntParam(id),
        driverId: BigInt(String(supirId))
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    }

    // Upload ke Supabase
    const fileName = `tugas/${id}/${type || 'AFTER'}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    // Simpan ke database
    const taskPhoto = await prisma.taskPhoto.create({
      data: {
        taskId: toBigIntParam(id),
        photoUrl: urlData.publicUrl,
        type: type || 'AFTER'
      }
    });

    res.json({
      success: true,
      message: 'Foto berhasil diupload',
      data: bigIntToString(taskPhoto)
    });

  } catch (error) {
    console.error('Error uploadFoto:', error);
    res.status(500).json({ success: false, message: 'Gagal upload foto' });
  }
};

// ==================== INPUT VOLUME ====================
export const inputVolume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { volume } = req.body;
    const supirId = (req as any).user.id;

    if (!volume || volume <= 0) {
      return res.status(400).json({ success: false, message: 'Volume harus diisi dan positif' });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: toBigIntParam(id),
        driverId: BigInt(String(supirId))
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: BigInt(id) },
      data: {
        volumeKg: volume,
        status: 'SELESAI',
        completedAt: new Date()
      }
    });

    // Jika dari aduan, simpan volume
    if (task.reportId) {
      await prisma.volume.create({
        data: {
          reportId: task.reportId,
          volumeKg: volume,
          recordedBy: BigInt(String(supirId))
        }
      });

      await prisma.report.update({
        where: { id: task.reportId },
        data: { status: 'SELESAI' }
      });
    }

    res.json({
      success: true,
      message: 'Volume berhasil disimpan',
      data: bigIntToString(updatedTask)
    });

  } catch (error) {
    console.error('Error inputVolume:', error);
    res.status(500).json({ success: false, message: 'Gagal input volume' });
  }
};

// ==================== RIWAYAT TUGAS ====================
export const getRiwayatTugas = async (req: Request, res: Response) => {
  try {
    const supirId = (req as any).user.id;
    const { page = '1', limit = '10', startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      driverId: BigInt(supirId),
      status: 'SELESAI'
    };

    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) where.completedAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.completedAt.lte = end;
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          truck: { select: { plateNumber: true } },
          photos: { where: { type: 'AFTER' }, take: 1 }
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        tasks: bigIntToString(tasks),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error getRiwayat:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat' });
  }
};

// ==================== PROFIL ====================
export const getProfil = async (req: Request, res: Response) => {
  try {
    const supirId = (req as any).user.id;

    const supir = await prisma.user.findUnique({
      where: { id: BigInt(String(supirId)) },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    const truck = await prisma.truck.findFirst({
      where: { operatorId: BigInt(String(supirId)) },
      select: { plateNumber: true, status: true }
    });

    const totalTugas = await prisma.task.count({
      where: { driverId: BigInt(String(supirId)) }
    });

    const tugasSelesai = await prisma.task.count({
      where: { driverId: BigInt(String(supirId)), status: 'SELESAI' }
    });

    res.json({
      success: true,
      data: {
        ...supir,
        id: supir?.id.toString(),
        truck: truck,
        statistik: {
          totalTugas,
          tugasSelesai,
          persentase: totalTugas ? Math.round((tugasSelesai / totalTugas) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getProfil:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil profil' });
  }
};

// ==================== UPDATE LOKASI ====================
export const updateLokasi = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    const supirId = (req as any).user.id;

    const truck = await prisma.truck.findFirst({
      where: { operatorId: BigInt(String(supirId)) }
    });

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truk tidak ditemukan' });
    }

    await prisma.truck.update({
      where: { id: truck.id },
      data: {
        currentLat: latitude,
        currentLong: longitude,
        lastPing: new Date()
      }
    });

    await prisma.locationHistory.create({
      data: {
        truckId: truck.id,
        latitude,
        longitude
      }
    });

    res.json({
      success: true,
      message: 'Lokasi berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error updateLokasi:', error);
    res.status(500).json({ success: false, message: 'Gagal update lokasi' });
  }
};