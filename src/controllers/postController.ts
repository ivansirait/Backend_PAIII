import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// 1. GET ALL (Untuk Tampilan Publik & Admin)
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { fullName: true } } }
    });
    const formatted = posts.map(p => ({
      ...p, id: p.id.toString(), authorId: p.authorId.toString(),
      authorName: p.author?.fullName || "Admin"
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil berita" });
  }
};

// 2. CREATE POST (Oleh Admin)
export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, category, authorId, imageUrl } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const newPost = await prisma.post.create({
      data: {
        title, content, category, slug, imageUrl,
        authorId: BigInt(authorId),
        isPublished: true
      }
    });
    res.json({ success: true, message: "Berita berhasil dibuat" });
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat berita" });
  }
};

// 3. DELETE POST
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsedId = Number.parseInt(String(id), 10);

    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: 'ID tidak valid' });
    }

    await prisma.post.delete({ where: { id: parsedId } });
    res.json({ success: true, message: "Berita dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus berita" });
  }
};