import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

// GET semua posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { 
        createdAt: 'desc' // ✅ Gunakan createdAt, BUKAN created_at
      },
      include: { 
        author: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single post by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validasi ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: { 
        author: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create new post
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, slug, content, category, imageUrl, author_id } = req.body;
    
    // Validasi
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Generate slug if not provided
    let generatedSlug = slug || title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Cek apakah slug sudah digunakan
    const existingPost = await prisma.post.findUnique({
      where: { slug: generatedSlug }
    });

    if (existingPost) {
      // Jika slug sudah ada, tambahkan timestamp
      const timestamp = Date.now().toString().slice(-4);
      generatedSlug = `${generatedSlug}-${timestamp}`;
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug: generatedSlug,
        content,
        category: category || 'BERITA',
        imageUrl: imageUrl || null, // ✅ Gunakan imageUrl, BUKAN image_url
        authorId: author_id ? BigInt(author_id) : BigInt(1), // ✅ Gunakan authorId, BUKAN author_id
        isPublished: true, // ✅ Gunakan isPublished, BUKAN is_published
        isFeatured: false // ✅ Gunakan isFeatured, BUKAN is_featured
      },
      include: { 
        author: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update post
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, category, imageUrl } = req.body;
    
    // Validasi ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    // Validasi input
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Cek apakah post ada
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Cek apakah slug sudah digunakan oleh post lain
    if (slug) {
      const postWithSameSlug = await prisma.post.findFirst({
        where: {
          slug,
          NOT: { id: parseInt(id) }
        }
      });

      if (postWithSameSlug) {
        return res.status(400).json({ message: 'Slug already used by another post' });
      }
    }

    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        title,
        slug,
        content,
        category,
        imageUrl, // ✅ Gunakan imageUrl, BUKAN image_url
        updatedAt: new Date() // ✅ Gunakan updatedAt, BUKAN updated_at
      },
      include: { 
        author: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE post
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validasi ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'ID tidak valid' 
      });
    }

    // Cek apakah post ada
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost) {
      return res.status(404).json({ 
        success: false,
        message: 'Post tidak ditemukan' 
      });
    }

    // Hapus post
    await prisma.post.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      success: true,
      message: 'Post deleted successfully',
      deletedId: id
    });
    
  } catch (error) {
    console.error('Error deleting post:', error);
    
    // Error handling untuk Prisma
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        message: 'Post tidak ditemukan' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;