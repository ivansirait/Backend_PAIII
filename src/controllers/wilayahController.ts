import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

// GET semua wilayah (kecamatan)
export const getAllWilayah = async (req: Request, res: Response) => {
  try {
    const wilayah = await prisma.location.findMany({
      where: { 
        locationType: 'KECAMATAN' 
      },
      orderBy: { name: 'asc' }
    });

    // Format response
    const formatted = wilayah.map(w => ({
      id: w.id.toString(),
      name: w.name,
      code: w.code,
      isActive: w.isActive,
      population: w.population,
      address: w.address,
      capacityVolume: w.capacityVolume,
      latitude: w.latitude.toString(),
      longitude: w.longitude.toString(),
      center: [Number(w.latitude), Number(w.longitude)],
      createdAt: w.createdAt,
      updatedAt: w.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching wilayah:', error);
    res.status(500).json({ error: 'Gagal mengambil data wilayah' });
  }
};

// GET wilayah by ID
export const getWilayahById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const wilayah = await prisma.location.findUnique({
      where: { id: BigInt(id) }
    });

    if (!wilayah) {
      return res.status(404).json({ error: 'Wilayah tidak ditemukan' });
    }

    res.json({
      id: wilayah.id.toString(),
      name: wilayah.name,
      code: wilayah.code,
      isActive: wilayah.isActive,
      population: wilayah.population,
      address: wilayah.address,
      capacityVolume: wilayah.capacityVolume,
      latitude: wilayah.latitude.toString(),
      longitude: wilayah.longitude.toString(),
      center: [Number(wilayah.latitude), Number(wilayah.longitude)],
      createdAt: wilayah.createdAt,
      updatedAt: wilayah.updatedAt
    });
  } catch (error) {
    console.error('Error fetching wilayah:', error);
    res.status(500).json({ error: 'Gagal mengambil data wilayah' });
  }
};

// POST tambah wilayah baru
export const createWilayah = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      code, 
      population, 
      address, 
      capacityVolume,
      latitude,
      longitude,
      isActive 
    } = req.body;

    // Validasi input wajib
    if (!name) {
      return res.status(400).json({ error: 'Nama wilayah harus diisi' });
    }

    // Cek apakah kode sudah digunakan
    if (code) {
      const existingCode = await prisma.location.findUnique({
        where: { code }
      });
      if (existingCode) {
        return res.status(400).json({ error: 'Kode wilayah sudah digunakan' });
      }
    }

    // Buat wilayah baru
    const newWilayah = await prisma.location.create({
      data: {
        name,
        locationType: 'KECAMATAN',
        code: code || null,
        population: population ? parseInt(population) : null,
        address: address || null,
        capacityVolume: capacityVolume ? parseInt(capacityVolume) : null,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({
      id: newWilayah.id.toString(),
      name: newWilayah.name,
      code: newWilayah.code,
      isActive: newWilayah.isActive,
      population: newWilayah.population,
      address: newWilayah.address,
      capacityVolume: newWilayah.capacityVolume,
      latitude: newWilayah.latitude.toString(),
      longitude: newWilayah.longitude.toString(),
      center: [Number(newWilayah.latitude), Number(newWilayah.longitude)],
      createdAt: newWilayah.createdAt
    });

  } catch (error) {
    console.error('Error creating wilayah:', error);
    res.status(500).json({ error: 'Gagal menambah wilayah' });
  }
};

// PUT update wilayah
export const updateWilayah = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      population, 
      address, 
      capacityVolume,
      latitude,
      longitude,
      isActive 
    } = req.body;

    // Cek apakah wilayah ada
    const existingWilayah = await prisma.location.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existingWilayah) {
      return res.status(404).json({ error: 'Wilayah tidak ditemukan' });
    }

    // Jika kode diubah, cek apakah sudah digunakan wilayah lain
    if (code && code !== existingWilayah.code) {
      const wilayahWithSameCode = await prisma.location.findUnique({
        where: { code }
      });
      if (wilayahWithSameCode) {
        return res.status(400).json({ error: 'Kode wilayah sudah digunakan' });
      }
    }

    // Update data
    const updatedWilayah = await prisma.location.update({
      where: { id: BigInt(id) },
      data: {
        name: name || existingWilayah.name,
        code: code !== undefined ? code : existingWilayah.code,
        population: population ? parseInt(population) : existingWilayah.population,
        address: address !== undefined ? address : existingWilayah.address,
        capacityVolume: capacityVolume ? parseInt(capacityVolume) : existingWilayah.capacityVolume,
        latitude: latitude ? parseFloat(latitude) : existingWilayah.latitude,
        longitude: longitude ? parseFloat(longitude) : existingWilayah.longitude,
        isActive: isActive !== undefined ? isActive : existingWilayah.isActive,
      }
    });

    res.json({
      id: updatedWilayah.id.toString(),
      name: updatedWilayah.name,
      code: updatedWilayah.code,
      isActive: updatedWilayah.isActive,
      population: updatedWilayah.population,
      address: updatedWilayah.address,
      capacityVolume: updatedWilayah.capacityVolume,
      latitude: updatedWilayah.latitude.toString(),
      longitude: updatedWilayah.longitude.toString(),
      center: [Number(updatedWilayah.latitude), Number(updatedWilayah.longitude)],
      createdAt: updatedWilayah.createdAt,
      updatedAt: updatedWilayah.updatedAt
    });

  } catch (error) {
    console.error('Error updating wilayah:', error);
    res.status(500).json({ error: 'Gagal mengupdate wilayah' });
  }
};

// DELETE wilayah
export const deleteWilayah = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Cek apakah wilayah ada
    const existingWilayah = await prisma.location.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existingWilayah) {
      return res.status(404).json({ error: 'Wilayah tidak ditemukan' });
    }

    // Hapus wilayah
    await prisma.location.delete({
      where: { id: BigInt(id) }
    });

    res.json({ message: 'Wilayah berhasil dihapus' });

  } catch (error) {
    console.error('Error deleting wilayah:', error);
    res.status(500).json({ error: 'Gagal menghapus wilayah' });
  }
};

// PATCH toggle status aktif/nonaktif
export const toggleWilayahStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const wilayah = await prisma.location.findUnique({
      where: { id: BigInt(id) }
    });

    if (!wilayah) {
      return res.status(404).json({ error: 'Wilayah tidak ditemukan' });
    }

    const updatedWilayah = await prisma.location.update({
      where: { id: BigInt(id) },
      data: { isActive: !wilayah.isActive }
    });

    res.json({
      id: updatedWilayah.id.toString(),
      isActive: updatedWilayah.isActive,
      message: `Wilayah ${updatedWilayah.isActive ? 'diaktifkan' : 'dinonaktifkan'}`
    });

  } catch (error) {
    console.error('Error toggling wilayah:', error);
    res.status(500).json({ error: 'Gagal mengubah status wilayah' });
  }
};

// GET semua polygon untuk peta
export const getAllPolygons = async (req: Request, res: Response) => {
  try {
    const polygons = await prisma.location.findMany({
      where: { 
        locationType: 'KECAMATAN',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        latitude: true,
        longitude: true,
        isActive: true
      }
    });

    res.json(polygons.map(p => ({
      id: p.id.toString(),
      name: p.name,
      code: p.code,
      center: [Number(p.latitude), Number(p.longitude)],
      isActive: p.isActive
    })));
    
  } catch (error) {
    console.error('Error fetching polygons:', error);
    res.status(500).json({ error: 'Gagal mengambil data polygon' });
  }
};