import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import multer from 'multer';
import fs from 'fs';

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
export const upload = multer({ storage });

// 1. GET ALL
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { fullName: true } } }
    });
    const formatted = posts.map(p => ({
      ...p,
      id: p.id.toString(),
      authorId: p.authorId ? p.authorId.toString() : null,
      authorName: p.author?.fullName || "Admin"
    }));
    res.json(formatted);
  } catch (error: any) {
    console.error('Error getAllPosts:', error);
    res.status(500).json({ error: "Gagal mengambil berita", detail: error.message });
  }
};

// 2. CREATE POST
export const createPost = async (req: Request, res: Response) => {
  try {
    const title = (req.body?.title || '') as string;
    const content = (req.body?.content || '') as string;
    const category = (req.body?.category || 'BERITA') as string;

    if (!title || !content) {
      return res.status(400).json({ error: "Title dan content wajib diisi" });
    }

    let imageUrl: string | null = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const slug = title.toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')
      .substring(0, 100);

    const existing = await prisma.post.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    await prisma.post.create({
      data: {
        title,
        content,
        category,
        slug: finalSlug,
        imageUrl,
        authorId: 1, // ✅ Int, bukan BigInt
        isPublished: true
      }
    });

    res.status(201).json({ success: true, message: "Berita berhasil dibuat" });
  } catch (error: any) {
    console.error('Error createPost:', error);
    res.status(500).json({ error: "Gagal membuat berita", detail: error.message });
  }
};

// 3. UPDATE POST ✅ PAKAI parseInt, BUKAN BigInt
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const title = (req.body?.title || '') as string;
    const content = (req.body?.content || '') as string;
    const category = (req.body?.category || '') as string;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "ID tidak valid" });
    }

    if (!title || !content) {
      return res.status(400).json({ error: "Title dan content wajib diisi" });
    }

    // ✅ Gunakan parseInt, bukan BigInt
    const existing = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Post tidak ditemukan" });
    }

    let imageUrl: string | null = existing.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // ✅ Gunakan parseInt, bukan BigInt
    await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        category: category || existing.category,
        imageUrl,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: "Berita berhasil diupdate" });
  } catch (error: any) {
    console.error('Error updatePost:', error);
    res.status(500).json({ error: "Gagal mengupdate berita", detail: error.message });
  }
};

// 4. DELETE POST ✅ PAKAI parseInt, BUKAN BigInt
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "ID tidak valid" });
    }

    const existing = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Post tidak ditemukan" });
    }

    await prisma.post.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Berita dihapus" });
  } catch (error: any) {
    console.error('Error deletePost:', error);
    res.status(500).json({ error: "Gagal menghapus berita", detail: error.message });
  }
};