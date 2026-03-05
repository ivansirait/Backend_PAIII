import express from 'express';
import multer from 'multer';
import { supabase } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate nama file unik
    const fileName = `GALLERY-${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
    
    // Upload ke Supabase (bucket 'Foto-sampah')
    const { error } = await supabase.storage
      .from('Foto-sampah') // PASTIKAN NAMA BUCKET LENGKAP
      .upload(fileName, req.file.buffer, { 
        contentType: req.file.mimetype 
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Dapatkan URL publik
    const { data: publicUrlData } = supabase
      .storage
      .from('Foto-sampah') // PASTIKAN NAMA BUCKET LENGKAP
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;
    console.log('✅ URL lengkap:', imageUrl); // CEK DI CONSOLE

    res.json({
      success: true,
      imageUrl: imageUrl, // Kirim URL lengkap
      filename: fileName
    });

  } catch (error) {
    console.error('Error uploading:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;