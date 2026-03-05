import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Definisikan tipe untuk NextFunction
type NextFunction = (err?: any) => void;

// Interface untuk Request dengan user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'rahasia-default'
    ) as { id: string; email: string; role: string };
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa.' 
    });
  }
};