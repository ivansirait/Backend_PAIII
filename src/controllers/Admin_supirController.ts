import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

// GET semua supir (role: OPERATOR)
export const getAllSupir = async (req: Request, res: Response) => {
  try {
    const supir = await prisma.user.findMany({
      where: { role: 'OPERATOR' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert BigInt ke string
    const formatted = supir.map(s => ({
      ...s,
      id: s.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching supir:', error);
    res.status(500).json({ error: 'Gagal mengambil data supir' });
  }
};

// GET supir by ID
export const getSupirById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const supir = await prisma.user.findFirst({
      where: { 
        id: BigInt(id),
        role: 'OPERATOR'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!supir) {
      return res.status(404).json({ error: 'Supir tidak ditemukan' });
    }

    res.json({
      ...supir,
      id: supir.id.toString()
    });
  } catch (error) {
    console.error('Error fetching supir:', error);
    res.status(500).json({ error: 'Gagal mengambil data supir' });
  }
};

// POST tambah supir baru
export const createSupir = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    // Validasi input
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        error: 'Nama lengkap, email, dan password harus diisi' 
      });
    }

    // Cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat supir baru
    const newSupir = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashedPassword,
        phoneNumber: phoneNumber || null,
        role: 'OPERATOR',
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      ...newSupir,
      id: newSupir.id.toString()
    });

  } catch (error) {
    console.error('Error creating supir:', error);
    res.status(500).json({ error: 'Gagal menambah supir' });
  }
};

// PUT update supir
export const updateSupir = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, isActive } = req.body;

    // Cek apakah supir ada
    const existingSupir = await prisma.user.findFirst({
      where: { 
        id: BigInt(id),
        role: 'OPERATOR'
      }
    });

    if (!existingSupir) {
      return res.status(404).json({ error: 'Supir tidak ditemukan' });
    }

    // Update data
    const updatedSupir = await prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        isActive: isActive !== undefined ? isActive : existingSupir.isActive
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({
      ...updatedSupir,
      id: updatedSupir.id.toString()
    });

  } catch (error) {
    console.error('Error updating supir:', error);
    res.status(500).json({ error: 'Gagal mengupdate supir' });
  }
};

// DELETE supir
export const deleteSupir = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Cek apakah supir ada
    const existingSupir = await prisma.user.findFirst({
      where: { 
        id: BigInt(id),
        role: 'OPERATOR'
      }
    });

    if (!existingSupir) {
      return res.status(404).json({ error: 'Supir tidak ditemukan' });
    }

    // Hapus supir
    await prisma.user.delete({
      where: { id: BigInt(id) }
    });

    res.json({ message: 'Supir berhasil dihapus' });

  } catch (error) {
    console.error('Error deleting supir:', error);
    res.status(500).json({ error: 'Gagal menghapus supir' });
  }
};