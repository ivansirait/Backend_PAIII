import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// GET semua gallery
export const getGalleries = async (req: Request, res: Response) => {
    try {
        const galleries = await prisma.gallery.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(galleries);
    } catch (error) {
        console.error('Error getGalleries:', error);
        res.status(500).json({ message: 'Gagal mengambil data galeri' });
    }
};

// GET satu gallery by id
export const getGalleryById = async (req: Request, res: Response) => {
    try {
        const gallery = await prisma.gallery.findUnique({
            where: { id: BigInt(req.params.id) },
        });
        if (!gallery) return res.status(404).json({ message: 'Galeri tidak ditemukan' });
        res.json(gallery);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data galeri' });
    }
};

// POST tambah galeri baru (upload via URL atau form)
export const createGallery = async (req: Request, res: Response) => {
    try {
        const { title, imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ message: 'imageUrl wajib diisi' });
        const gallery = await prisma.gallery.create({
            data: { title, imageUrl },
        });
        res.status(201).json(gallery);
    } catch (error) {
        console.error('Error createGallery:', error);
        res.status(500).json({ message: 'Gagal membuat galeri' });
    }
};

// DELETE gallery
export const deleteGallery = async (req: Request, res: Response) => {
    try {
        await prisma.gallery.delete({ where: { id: BigInt(req.params.id) } });
        res.json({ message: 'Galeri berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus galeri' });
    }
};
