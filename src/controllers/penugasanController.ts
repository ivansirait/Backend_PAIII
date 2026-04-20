import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

const toBigIntParam = (value: string | string[] | undefined): bigint => {
  if (Array.isArray(value)) {
    return BigInt(value[0]);
  }

  if (!value) {
    throw new Error('ID tidak valid');
  }

  return BigInt(value);
};

// Helper untuk generate task number
const generateTaskNumber = async (type: string): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = type === 'ADUAN' ? 'AD' : 'RT';
  
  // Cari task terakhir hari ini
  const lastTask = await prisma.task.findFirst({
    where: {
      taskNumber: {
        startsWith: `${prefix}${year}${month}${day}`
      }
    },
    orderBy: {
      taskNumber: 'desc'
    }
  });

  let sequence = 1;
  if (lastTask) {
    const lastSequence = parseInt(lastTask.taskNumber.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}${year}${month}${day}${String(sequence).padStart(3, '0')}`;
};

// GET semua penugasan (dengan filter)
export const getAllPenugasan = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status, 
      type, 
      driverId,
      startDate,
      endDate 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Filter
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (driverId) where.driverId = BigInt(driverId as string);
    
    // Filter tanggal
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.scheduledAt.lte = end;
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          driver: {
            select: { id: true, fullName: true, phoneNumber: true }
          },
          truck: {
            select: { id: true, plateNumber: true }
          },
          assigner: {
            select: { id: true, fullName: true }
          },
          report: {
            select: { id: true, description: true, photoUrl: true }
          }
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.task.count({ where })
    ]);

    // Format BigInt ke string
    const formatted = tasks.map(task => ({
      ...task,
      id: task.id.toString(),
      driverId: task.driverId.toString(),
      truckId: task.truckId?.toString(),
      assignerId: task.assignerId.toString(),
      reportId: task.reportId?.toString(),
      driver: task.driver ? {
        ...task.driver,
        id: task.driver.id.toString()
      } : null,
      truck: task.truck ? {
        ...task.truck,
        id: task.truck.id.toString()
      } : null,
      assigner: task.assigner ? {
        ...task.assigner,
        id: task.assigner.id.toString()
      } : null
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error get penugasan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data penugasan' });
  }
};

// GET penugasan by ID
export const getPenugasanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: toBigIntParam(id) },
      include: {
        driver: {
          select: { id: true, fullName: true, phoneNumber: true, email: true }
        },
        truck: {
          select: { id: true, plateNumber: true, status: true }
        },
        assigner: {
          select: { id: true, fullName: true }
        },
        report: {
          include: {
            user: {
              select: { fullName: true, phoneNumber: true }
            }
          }
        },
        photos: true
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        ...task,
        id: task.id.toString(),
        driverId: task.driverId.toString(),
        truckId: task.truckId?.toString(),
        assignerId: task.assignerId.toString(),
        reportId: task.reportId?.toString()
      }
    });

  } catch (error) {
    console.error('Error get penugasan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data penugasan' });
  }
};

// POST buat penugasan baru (dari laporan aduan)
// POST buat penugasan baru (dari laporan aduan)
export const createPenugasanDariAduan = async (req: Request, res: Response) => {
  try {
    const { 
      reportId,      // ID laporan dari masyarakat
      driverId, 
      truckId, 
      scheduledAt,
      notes 
    } = req.body;

    const adminId = (req as any).user.id; // ID admin yang login

    // Validasi input
    if (!reportId || !driverId || !scheduledAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Laporan, supir, dan jadwal harus diisi' 
      });
    }

    // Cek apakah laporan ada
    const report = await prisma.report.findUnique({
      where: { id: BigInt(String(reportId)) }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
    }

    // Cek apakah laporan sudah ditugaskan
    const existingTask = await prisma.task.findFirst({
      where: { reportId: BigInt(String(reportId)) }
    });

    if (existingTask) {
      return res.status(400).json({ 
        success: false, 
        message: 'Laporan ini sudah memiliki penugasan' 
      });
    }

    // Generate task number
    const taskNumber = await generateTaskNumber('ADUAN');

    // Buat task baru
    const newTask = await prisma.task.create({
      data: {
        taskNumber,
        type: 'ADUAN',
        status: 'DITUGASKAN',
        driverId: BigInt(String(driverId)),
        truckId: truckId ? BigInt(String(truckId)) : null,
        assignerId: BigInt(String(adminId)),
        reportId: BigInt(String(reportId)),
        location: report.description || 'Lokasi belum diisi',
        latitude: report.latitude,
        longitude: report.longitude,
        district: 'Unknown',
        description: report.description,
        scheduledAt: new Date(scheduledAt)
      }
    });

    // 🔴 PENTING: Update status laporan
    await prisma.report.update({
      where: { id: BigInt(reportId) },
      data: { status: 'DITINDAKLANJUTI' }
    });

    // 🔴 PENTING: Buat notifikasi untuk supir
    await prisma.notification.create({
      data: {
        userId: BigInt(driverId),
        title: 'Tugas Baru',
        message: `Anda mendapat tugas baru: ${report.description?.substring(0, 50)}...`,
        isRead: false
      }
    });

    // 🔴 PENTING: Update status truk menjadi BUSY (jika pakai truk)
    if (truckId) {
      await prisma.truck.update({
        where: { id: BigInt(truckId) },
        data: { status: 'BUSY' }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Penugasan berhasil dibuat',
      data: {
        ...newTask,
        id: newTask.id.toString()
      }
    });

  } catch (error) {
    console.error('Error create penugasan:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat penugasan' });
  }
};

// PUT update penugasan
export const updatePenugasan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driverId, truckId, scheduledAt, status, notes } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id: toBigIntParam(id) }
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: toBigIntParam(id) },
      data: {
        driverId: driverId ? BigInt(driverId) : undefined,
        truckId: truckId ? BigInt(truckId) : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status: status || undefined
      }
    });

    res.json({
      success: true,
      message: 'Penugasan berhasil diperbarui',
      data: {
        ...updatedTask,
        id: updatedTask.id.toString()
      }
    });

  } catch (error) {
    console.error('Error update penugasan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate penugasan' });
  }
};

// DELETE penugasan
export const deletePenugasan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id: toBigIntParam(id) }
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }

    // Jika tugas dari aduan, kembalikan status laporan
    if (existingTask.reportId) {
      await prisma.report.update({
        where: { id: existingTask.reportId },
        data: { status: 'PENDING' }
      });
    }

    await prisma.task.delete({
      where: { id: toBigIntParam(id) }
    });

    res.json({
      success: true,
      message: 'Penugasan berhasil dihapus'
    });

  } catch (error) {
    console.error('Error delete penugasan:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus penugasan' });
  }
};

// GET daftar supir aktif (untuk dropdown)
export const getDaftarSupir = async (req: Request, res: Response) => {
  try {
    const supir = await prisma.user.findMany({
      where: { 
        role: 'OPERATOR',
        isActive: true 
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true
      },
      orderBy: { fullName: 'asc' }
    });

    res.json({
      success: true,
      data: supir.map(s => ({
        ...s,
        id: s.id.toString()
      }))
    });

  } catch (error) {
    console.error('Error get daftar supir:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data supir' });
  }
};

// GET daftar truk aktif (untuk dropdown)
export const getDaftarTruk = async (req: Request, res: Response) => {
  try {
    const truk = await prisma.truck.findMany({
      where: { 
        status: 'AVAILABLE' 
      },
      select: {
        id: true,
        plateNumber: true,
        status: true
      },
      orderBy: { plateNumber: 'asc' }
    });

    res.json({
      success: true,
      data: truk.map(t => ({
        ...t,
        id: t.id.toString()
      }))
    });

  } catch (error) {
    console.error('Error get daftar truk:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data truk' });
  }
};