import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterDTO, LoginDTO, AuthResponse } from '../types';

const prisma = new PrismaClient();

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const { email, password, name } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }
    };
  }

  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    // Простая и надежная реализация
    return jwt.sign(
      { userId: userId }, 
      secret, 
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    try {
      const decoded = jwt.verify(token, secret) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}