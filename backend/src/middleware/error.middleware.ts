import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error.message);

  // Обработка специфичных ошибок
  if (error.message === 'User already exists') {
    return res.status(400).json({ message: error.message });
  }

  if (error.message === 'Invalid credentials') {
    return res.status(401).json({ message: error.message });
  }

  if (error.message === 'Book not found') {
    return res.status(404).json({ message: error.message });
  }

  if (error.message === 'Invalid token') {
    return res.status(401).json({ message: error.message });
  }

  // Ошибки Prisma
  if (error.message.includes('Prisma')) {
    return res.status(500).json({ message: 'Database error' });
  }

  // Остальные ошибки
  res.status(500).json({ message: 'Internal server error' });
};