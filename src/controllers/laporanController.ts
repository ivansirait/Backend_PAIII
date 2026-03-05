import type { Request, Response } from 'express';
import { prisma, supabase } from '../config/db.js';

/* =======================
   GET LAPORAN
======================= */
export const getLaporan = async (req: Request, res: Response) => {
  try {
    const data = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal ambil data" });
  }
};

/* =======================
   CREATE LAPORAN (WARGA)
======================= */
export const createLaporan = async (req: Request, res: Response) => {
  const { pelapor, lokasi, deskripsi, latitude, longitude } = req.body;
  const file = req.file;

  try {
    let photoUrl: string | null = null;

    if (file) {
      const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
      const { error } = await supabase.storage
        .from('Foto-sampah')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) throw error;

      const { data: publicUrlData } = supabase
        .storage
        .from('Foto-sampah')
        .getPublicUrl(fileName);

      photoUrl = publicUrlData.publicUrl;
    }

    const dataBaru = await prisma.report.create({
      data: {
        description: `[PELAPOR: ${pelapor}] - [LOKASI: ${lokasi}] - ${deskripsi}`,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        status: 'PENDING',
        userId: BigInt(1), // sementara
        photoUrl,
      }
    });

    res.status(201).json(dataBaru);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/* =======================
   UPDATE STATUS (ADMIN)
======================= */
export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const update = await prisma.report.update({
      where: { id: BigInt(id) },
      data: { status }
    });
    res.json(update);
  } catch (error) {
    res.status(500).json({ error: "Gagal update status" });
  }
};

/* =======================
   DELETE LAPORAN
======================= */
export const deleteLaporan = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.report.delete({
      where: { id: BigInt(id) }
    });
    res.json({ message: "Laporan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus laporan" });
  }
};

/* ==================================================
   🔥 SELESAI LAPORAN (SUPIR)
   - upload foto setelah angkut
   - input volume
   - update status
================================================== */
export const selesaiLaporan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { volumeKg } = req.body;
  const file = req.file;

  try {
    if (!volumeKg || Number(volumeKg) <= 0) {
      return res.status(400).json({ error: "Volume tidak valid" });
    }

    let photoAfterUrl: string | null = null;

    // Upload foto AFTER ke Supabase
    if (file) {
      const fileName = `AFTER-${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
      const { error } = await supabase.storage
        .from('Foto-sampah')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) throw error;

      const { data: publicUrlData } = supabase
        .storage
        .from('Foto-sampah')
        .getPublicUrl(fileName);

      photoAfterUrl = publicUrlData.publicUrl;
    }

    // Simpan volume + update report (TRANSACTION)
    await prisma.$transaction([
      prisma.volume.create({
        data: {
          reportId: BigInt(id),
          volumeKg: Number(volumeKg),
          recordedBy: BigInt(1), // nanti ganti user supir login
        }
      }),
      prisma.report.update({
        where: { id: BigInt(id) },
        data: {
          status: 'SELESAI',
          photoAfterUrl,
        }
      })
    ]);

    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Gagal menyelesaikan laporan" });
  }
};