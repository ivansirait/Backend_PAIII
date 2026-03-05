import express from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../config/db.js'
import { Prisma } from '@prisma/client'

const router = express.Router()

// Helper untuk parse ID
const parseId = (idParam: string): number | null => {
  const id = Number(idParam)
  return Number.isNaN(id) ? null : id
}

// GET semua galleries
router.get('/', async (_req: Request, res: Response) => {
  try {
    const galleries = await prisma.gallery.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(galleries)
  } catch (error) {
    console.error('Error fetching galleries:', error)

    res.status(500).json({
      message: 'Terjadi kesalahan server'
    })
  }
})

// GET gallery untuk slider
router.get('/slider', async (_req: Request, res: Response) => {
  try {
    const sliders = await prisma.gallery.findMany({
      where: {
        isSlider: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(sliders)
  } catch (error) {
    console.error('Error fetching slider galleries:', error)

    res.status(500).json({
      message: 'Terjadi kesalahan server'
    })
  }
})

// GET single gallery
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id)

    if (!id) {
      return res.status(400).json({ message: 'ID tidak valid' })
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id }
    })

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery tidak ditemukan' })
    }

    res.json(gallery)
  } catch (error) {
    console.error('Error fetching gallery:', error)

    res.status(500).json({
      message: 'Terjadi kesalahan server'
    })
  }
})

// POST create new gallery
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, imageUrl, isSlider } = req.body

    if (!imageUrl) {
      return res.status(400).json({
        message: 'Image URL wajib diisi'
      })
    }

    const gallery = await prisma.gallery.create({
      data: {
        title: title ?? null,
        imageUrl,
        isSlider: Boolean(isSlider)
      }
    })

    res.status(201).json(gallery)
  } catch (error) {
    console.error('Error creating gallery:', error)

    res.status(500).json({
      message: 'Terjadi kesalahan server'
    })
  }
})

// PUT update gallery
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id)

    if (!id) {
      return res.status(400).json({ message: 'ID tidak valid' })
    }

    const { title, imageUrl, isSlider } = req.body

    const gallery = await prisma.gallery.update({
      where: { id },
      data: {
        title,
        imageUrl,
        isSlider
      }
    })

    res.json(gallery)
  } catch (error) {
    console.error('Error updating gallery:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          message: 'Gallery tidak ditemukan'
        })
      }
    }

    res.status(500).json({
      message: 'Terjadi kesalahan server'
    })
  }
})

// DELETE gallery
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id)

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID tidak valid'
      })
    }

    await prisma.gallery.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Gallery berhasil dihapus',
      deletedId: id
    })
  } catch (error) {
    console.error('Error deleting gallery:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Gallery tidak ditemukan'
        })
      }
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    })
  }
})

export default router