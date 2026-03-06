import express from 'express';
import type { Request, Response } from 'express'; // Tambahkan kata 'type'

// BAGIAN PERBAIKAN: Gunakan .js di akhir path jika menggunakan "type": "module"
import { prisma, supabase } from '../config/db.js'; 

export const getLaporan = async (req : Request, res : Response) => {
  try {
    const data = await prisma.report.findMany();
    res.json(data);
  } catch (error) {
    console.error("ERROR GET LAPORAN:", error);
    res.status(500).json({ error: "Gagal ambil data", detail: error });
  }
};


export const createLaporan = async (req: Request, res: Response) => {
  const { pelapor, lokasi, deskripsi, latitude, longitude } = req.body;
  const file = req.file;

  try {
    let photoUrl = null;
    if (file) {
      const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('Foto-sampah')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('Foto-sampah').getPublicUrl(fileName);
      photoUrl = publicUrlData.publicUrl;
    }

    const dataBaru = await prisma.report.create({
      data: {
        description: `[PELAPOR: ${pelapor}] - [LOKASI: ${lokasi}] - ${deskripsi}`,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        status: 'PENDING', 
        userId: BigInt(1),
        photoUrl: photoUrl,
      }
    });
    res.status(201).json(dataBaru);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

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

export const deleteLaporan = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.report.delete({ where: { id: BigInt(id) } });
    res.json({ message: "Laporan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus laporan" });
  }
};