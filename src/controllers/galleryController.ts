import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// GET semua galleries (untuk homepage & admin)
export const getAllGalleries = async (req: Request, res: Response) => {
  try {
    const galleries = await prisma.gallery.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Format response (ubah BigInt ke string)
    const formatted = galleries.map(g => ({
      ...g,
      id: g.id.toString()
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({ error: "Gagal mengambil galeri" });
  }
};

// GET gallery untuk slider
export const getSliderGalleries = async (req: Request, res: Response) => {
  try {
    const sliders = await prisma.gallery.findMany({
      where: { isSlider: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const formatted = sliders.map(g => ({
      ...g,
      id: g.id.toString()
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching slider galleries:', error);
    res.status(500).json({ error: "Gagal mengambil slider galeri" });
  }
};

// GET single gallery by id
export const getGalleryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    
    res.json({
      ...gallery,
      id: gallery.id.toString()
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: "Gagal mengambil galeri" });
  }
};

// CREATE gallery (admin only)
export const createGallery = async (req: Request, res: Response) => {
  try {
    const { title, description, imageUrl, isSlider } = req.body; // TAMBAH description
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false,
        message: 'Image URL is required' 
      });
    }

    const gallery = await prisma.gallery.create({
      data: {
        title: title || null,
        description: description || null, // TAMBAHKAN INI
        imageUrl,
        isSlider: isSlider || false
      }
    });
    
    res.status(201).json({ 
      success: true,
      message: 'Galeri berhasil ditambahkan',
      data: {
        ...gallery,
        id: gallery.id.toString()
      }
    });
  } catch (error) {
    console.error('Error creating gallery:', error);
    res.status(500).json({ 
      success: false,
      error: "Gagal menambah galeri" 
    });
  }
};

// UPDATE gallery (admin only)
export const updateGallery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, isSlider } = req.body; // TAMBAH description
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID tidak valid' 
      });
    }

    // Cek apakah gallery ada
    const existingGallery = await prisma.gallery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingGallery) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery tidak ditemukan' 
      });
    }

    const gallery = await prisma.gallery.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description, // TAMBAHKAN INI
        imageUrl,
        isSlider
      }
    });
    
    res.json({ 
      success: true,
      message: 'Galeri berhasil diperbarui',
      data: {
        ...gallery,
        id: gallery.id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating gallery:', error);
    res.status(500).json({ 
      success: false,
      error: "Gagal memperbarui galeri" 
    });
  }
};

// DELETE gallery (admin only)
export const deleteGallery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID tidak valid' 
      });
    }

    // Cek apakah gallery ada
    const existingGallery = await prisma.gallery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingGallery) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery tidak ditemukan' 
      });
    }

    await prisma.gallery.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      success: true,
      message: 'Galeri berhasil dihapus',
      deletedId: id
    });
    
  } catch (error) {
    console.error('Error deleting gallery:', error);
    res.status(500).json({ 
      success: false,
      error: "Gagal menghapus galeri" 
    });
  }
};