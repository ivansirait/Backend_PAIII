import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    if (!user.isActive) return res.status(403).json({ error: "Akun dinonaktifkan oleh Admin" });

    // Cek password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: "Password salah" });

    res.json({ 
      message: "Login Berhasil", 
      user: { id: user.id, name: user.fullName, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
};