import type { Request, Response } from 'express';
import { prisma, supabase } from '../config/db.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 10000);
const ML_CONFIDENCE_THRESHOLD = Number(process.env.ML_CONFIDENCE_THRESHOLD || 0.7);
const AI_VALIDATION_ENABLED = String(process.env.AI_VALIDATION_ENABLED || 'false').toLowerCase() === 'true';

type MlPredictResponse = {
  is_waste?: boolean;
  confidence?: number;
  class_name?: string;
  reason?: string;
  message?: string;
};

const callMlPredictService = async (file: Express.Multer.File): Promise<MlPredictResponse> => {
  const formData = new FormData();
  const bytes = new Uint8Array(file.buffer.length);
  bytes.set(file.buffer);
  const blob = new Blob([bytes], { type: file.mimetype });
  formData.append('image', blob, file.originalname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/api/predict`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ML service merespons ${response.status}`);
    }

    return (await response.json()) as MlPredictResponse;
  } finally {
    clearTimeout(timeout);
  }
};

const toBigIntParam = (value: string | string[] | undefined): bigint => {
  if (Array.isArray(value)) {
    return BigInt(value[0]);
  }

  if (!value) {
    throw new Error('ID tidak valid');
  }

  return BigInt(value);
};

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
   GET LAPORAN BY ID (PWA Cek Status)
======================= */
export const getLaporanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const laporan = await prisma.report.findUnique({
      where: { id: toBigIntParam(id) },
      select: {
        id: true,
        description: true,
        latitude: true,
        longitude: true,
        photoUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        photoAfterUrl: true
      }
    });

    if (!laporan) {
      return res.status(404).json({ 
        success: false,
        error: 'Laporan tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      data: laporan
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/* =======================
   CREATE LAPORAN (WARGA)
======================= */
export const createLaporan = async (req: Request, res: Response) => {
  const { pelapor, lokasi, deskripsi, latitude, longitude } = req.body;
  const file = req.file;

  try {
    // 🔒 VALIDASI: GPS WAJIB ADA
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'GPS tidak bisa diterima. Aktifkan lokasi di ponsel Anda!'
      });
    }

    if (lat === 0 || lng === 0) {
      return res.status(400).json({
        success: false,
        error: 'Koordinat GPS tidak valid (0,0). Pastikan GPS aktif dan outdoor!'
      });
    }

    // Cek latitude range: -90 to 90
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: 'Latitude tidak valid. Cek ulang data GPS.'
      });
    }

    // Cek longitude range: -180 to 180
    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Longitude tidak valid. Cek ulang data GPS.'
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        status: 'failed_validation',
        error: 'Foto wajib diunggah untuk validasi sampah.'
      });
    }

    let confidence = 1;
    let isWaste = true;
    let className = 'validation_disabled';

    if (AI_VALIDATION_ENABLED) {
      let mlResult: MlPredictResponse;
      try {
        mlResult = await callMlPredictService(file);
      } catch (error: any) {
        const isTimeout = error?.name === 'AbortError';
        return res.status(503).json({
          success: false,
          status: 'failed_validation',
          error: isTimeout
            ? 'Validasi foto timeout. Silakan coba lagi.'
            : 'Layanan validasi foto sedang tidak tersedia. Silakan coba lagi.',
          is_waste: false,
          confidence: 0,
          class_name: 'unknown',
          reason: 'validation_service_unavailable'
        });
      }

      confidence = typeof mlResult.confidence === 'number' ? mlResult.confidence : 0;
      isWaste = Boolean(mlResult.is_waste);
      className = mlResult.class_name || 'unknown';

      if (!isWaste || confidence < ML_CONFIDENCE_THRESHOLD) {
        return res.status(422).json({
          success: false,
          status: 'rejected_by_ml',
          error: 'Foto tidak terdeteksi sebagai sampah, laporan tidak dapat diproses.',
          is_waste: isWaste,
          confidence,
          class_name: className,
          reason: mlResult.reason || mlResult.message || 'not_waste_detected'
        });
      }
    }

    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage
      .from('Foto-sampah')
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    const { data: publicUrlData } = supabase
      .storage
      .from('Foto-sampah')
      .getPublicUrl(fileName);

    const photoUrl = publicUrlData.publicUrl;

    const dataBaru = await prisma.report.create({
      data: {
        description: `[PELAPOR: ${pelapor}] - [LOKASI: ${lokasi}] - ${deskripsi}`,
        latitude: lat,
        longitude: lng,
        status: 'PENDING',
        userId: BigInt(1),
        photoUrl,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Laporan berhasil dibuat!',
      validation: {
        is_waste: isWaste,
        confidence,
        class_name: className,
        threshold: ML_CONFIDENCE_THRESHOLD
      },
      data: dataBaru
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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
      where: { id: toBigIntParam(id) },
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
      where: { id: toBigIntParam(id) }
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
          reportId: toBigIntParam(id),
          volumeKg: Number(volumeKg),
          recordedBy: BigInt(1), // nanti ganti user supir login
        }
      }),
      prisma.report.update({
        where: { id: toBigIntParam(id) },
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

/* ==================================================
   🤖 VALIDASI FOTO DENGAN ML SERVICE
   - endpoint internal backend utama
   - frontend tidak memanggil ML langsung
================================================== */
export const validateLaporanPhoto = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        status: 'failed_validation',
        message: 'File gambar wajib diunggah pada field image.'
      });
    }

    if (!AI_VALIDATION_ENABLED) {
      return res.json({
        success: true,
        status: 'accepted',
        is_waste: true,
        confidence: 1,
        class_name: 'validation_disabled',
        reason: 'ai_validation_disabled',
        threshold: ML_CONFIDENCE_THRESHOLD
      });
    }

    const mlResult = await callMlPredictService(file);
    const confidence = typeof mlResult.confidence === 'number' ? mlResult.confidence : 0;
    const isWaste = Boolean(mlResult.is_waste);
    const className = mlResult.class_name || 'unknown';

    const decision = isWaste && confidence >= ML_CONFIDENCE_THRESHOLD
      ? 'accepted'
      : 'rejected_by_ml';

    return res.json({
      success: true,
      status: decision,
      is_waste: isWaste,
      confidence,
      class_name: className,
      reason: mlResult.reason || mlResult.message || null,
      threshold: ML_CONFIDENCE_THRESHOLD
    });
  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError';

    return res.status(503).json({
      success: false,
      status: 'failed_validation',
      message: isTimeout
        ? 'Validasi foto sedang timeout. Silakan coba lagi.'
        : 'ML service sedang tidak tersedia. Silakan coba lagi.',
      is_waste: false,
      confidence: 0,
      class_name: 'unknown',
      reason: 'validation_service_unavailable'
    });
  }
};