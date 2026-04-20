import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

const toBigIntParam = (value: string | string[] | undefined): bigint => {
  if (Array.isArray(value)) {
    return BigInt(value[0]);
  }

  if (!value) {
    throw new Error('ID tidak valid');
  }

  return BigInt(value);
};

// GET semua truk
export const getAllTruk = async (req: Request, res: Response) => {
  try {
    const truk = await prisma.truck.findMany({
      include: {
        operator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert BigInt ke string
    const formatted = truk.map(t => ({
      ...t,
      id: t.id.toString(),
      operatorId: t.operatorId?.toString(),
      operator: t.operator ? {
        ...t.operator,
        id: t.operator.id.toString()
      } : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching truk:', error);
    res.status(500).json({ error: 'Gagal mengambil data truk' });
  }
};

// GET truk by ID
export const getTrukById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const truk = await prisma.truck.findUnique({
      where: { id: toBigIntParam(id) },
      include: {
        operator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!truk) {
      return res.status(404).json({ error: 'Truk tidak ditemukan' });
    }

    res.json({
      ...truk,
      id: truk.id.toString(),
      operatorId: truk.operatorId?.toString(),
      operator: truk.operator ? {
        ...truk.operator,
        id: truk.operator.id.toString()
      } : null
    });
  } catch (error) {
    console.error('Error fetching truk:', error);
    res.status(500).json({ error: 'Gagal mengambil data truk' });
  }
};

// POST tambah truk baru
export const createTruk = async (req: Request, res: Response) => {
  try {
    const { 
      plateNumber, 
      operatorId, 
      status,
      lastLocation 
    } = req.body;

    // Validasi input wajib
    if (!plateNumber) {
      return res.status(400).json({ error: 'Nomor polisi harus diisi' });
    }

    // Cek apakah nomor polisi sudah digunakan
    const existingTruk = await prisma.truck.findUnique({
      where: { plateNumber }
    });

    if (existingTruk) {
      return res.status(400).json({ error: 'Nomor polisi sudah terdaftar' });
    }

    // Buat truk baru
    const newTruk = await prisma.truck.create({
      data: {
        plateNumber,
        operatorId: operatorId ? BigInt(operatorId) : null,
        status: status || 'AVAILABLE',
        lastLocation: lastLocation || null,
      },
      include: {
        operator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      ...newTruk,
      id: newTruk.id.toString(),
      operatorId: newTruk.operatorId?.toString(),
      operator: newTruk.operator ? {
        ...newTruk.operator,
        id: newTruk.operator.id.toString()
      } : null
    });

  } catch (error) {
    console.error('Error creating truk:', error);
    res.status(500).json({ error: 'Gagal menambah truk' });
  }
};

// PUT update truk
export const updateTruk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      plateNumber, 
      operatorId, 
      status,
      lastLocation 
    } = req.body;

    // Cek apakah truk ada
    const existingTruk = await prisma.truck.findUnique({
      where: { id: toBigIntParam(id) }
    });

    if (!existingTruk) {
      return res.status(404).json({ error: 'Truk tidak ditemukan' });
    }

    // Jika nomor polisi diubah, cek apakah sudah digunakan truk lain
    if (plateNumber && plateNumber !== existingTruk.plateNumber) {
      const trukWithSamePlate = await prisma.truck.findUnique({
        where: { plateNumber }
      });
      
      if (trukWithSamePlate) {
        return res.status(400).json({ error: 'Nomor polisi sudah digunakan truk lain' });
      }
    }

    // Update data
    const updatedTruk = await prisma.truck.update({
      where: { id: toBigIntParam(id) },
      data: {
        plateNumber: plateNumber || existingTruk.plateNumber,
        operatorId: operatorId ? BigInt(operatorId) : existingTruk.operatorId,
        status: status || existingTruk.status,
        lastLocation: lastLocation !== undefined ? lastLocation : existingTruk.lastLocation,
      },
      include: {
        operator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({
      ...updatedTruk,
      id: updatedTruk.id.toString(),
      operatorId: updatedTruk.operatorId?.toString(),
      operator: updatedTruk.operator ? {
        ...updatedTruk.operator,
        id: updatedTruk.operator.id.toString()
      } : null
    });

  } catch (error) {
    console.error('Error updating truk:', error);
    res.status(500).json({ error: 'Gagal mengupdate truk' });
  }
};

// DELETE truk
export const deleteTruk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Cek apakah truk ada
    const existingTruk = await prisma.truck.findUnique({
      where: { id: toBigIntParam(id) }
    });

    if (!existingTruk) {
      return res.status(404).json({ error: 'Truk tidak ditemukan' });
    }

    // Hapus truk
    await prisma.truck.delete({
      where: { id: toBigIntParam(id) }
    });

    res.json({ message: 'Truk berhasil dihapus' });

  } catch (error) {
    console.error('Error deleting truk:', error);
    res.status(500).json({ error: 'Gagal menghapus truk' });
  }
};