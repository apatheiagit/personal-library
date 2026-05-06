"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class BooksService {
    async getAllBooks(userId) {
        return prisma.book.findMany({
            where: { userId },
            orderBy: { addedDate: 'desc' }
        });
    }
    async getBookById(id, userId) {
        const book = await prisma.book.findFirst({
            where: { id, userId }
        });
        if (!book) {
            throw new Error('Book not found');
        }
        return book;
    }
    async createBook(userId, data) {
        return prisma.book.create({
            data: {
                ...data,
                userId,
                addedDate: new Date()
            }
        });
    }
    async updateBook(id, userId, data) {
        // Проверяем существование книги
        const existingBook = await this.getBookById(id, userId);
        return prisma.book.update({
            where: { id },
            data
        });
    }
    async deleteBook(id, userId) {
        // Проверяем существование книги
        await this.getBookById(id, userId);
        return prisma.book.delete({
            where: { id }
        });
    }
    async getBooksByStatus(userId, status) {
        return prisma.book.findMany({
            where: { userId, status },
            orderBy: { addedDate: 'desc' }
        });
    }
    async getStatistics(userId) {
        const books = await prisma.book.findMany({
            where: { userId }
        });
        const readBooks = books.filter(b => b.status === 'read');
        const wishlistBooks = books.filter(b => b.status === 'want-to-read');
        const ratings = readBooks.filter(b => b.rating).map(b => b.rating);
        const averageRating = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
        const byYear = readBooks.reduce((acc, book) => {
            const year = book.year || 0;
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});
        return {
            totalRead: readBooks.length,
            totalWishlist: wishlistBooks.length,
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalBooks: books.length,
            byYear
        };
    }
}
exports.BooksService = BooksService;
