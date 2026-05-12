import { PrismaClient } from '@prisma/client';
import { CreateBookDTO, UpdateBookDTO } from '../types';

const prisma = new PrismaClient();

export class BooksService {
  async getAllBooks(userId: string) {
    return prisma.book.findMany({
      where: { userId },
      orderBy: { addedDate: 'desc' }
    });
  }

  async getBookById(id: string, userId: string) {
    const book = await prisma.book.findFirst({
      where: { id, userId }
    });

    if (!book) {
      throw new Error('Book not found');
    }

    return book;
  }

  async createBook(userId: string, data: CreateBookDTO) {
    return prisma.book.create({
      data: {
        ...data,
        userId,
        addedDate: new Date()
      }
    });
  }

  async updateBook(id: string, userId: string, data: UpdateBookDTO) {
    // Проверяем существование книги
    const existingBook = await this.getBookById(id, userId);

    return prisma.book.update({
      where: { id },
      data
    });
  }

  async deleteBook(id: string, userId: string) {
    // Проверяем существование книги
    await this.getBookById(id, userId);

    return prisma.book.delete({
      where: { id }
    });
  }

  async getBooksByStatus(userId: string, status: 'read' | 'want-to-read') {
    return prisma.book.findMany({
      where: { userId, status },
      orderBy: { addedDate: 'desc' }
    });
  }

  async getStatistics(userId: string) {
    const books = await prisma.book.findMany({
      where: { userId }
    });

    const readBooks = books.filter(b => b.status === 'read');
    const wishlistBooks = books.filter(b => b.status === 'want-to-read');
    
    const ratings = readBooks.filter(b => b.rating).map(b => b.rating!);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    const byYear = readBooks.reduce((acc, book) => {
      const year = book.year || 0;
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalRead: readBooks.length,
      totalWishlist: wishlistBooks.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalBooks: books.length,
      byYear
    };
  }
}