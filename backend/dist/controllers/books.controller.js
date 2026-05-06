"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksController = void 0;
const books_service_1 = require("../services/books.service");
const booksService = new books_service_1.BooksService();
class BooksController {
    async getAllBooks(req, res, next) {
        try {
            const books = await booksService.getAllBooks(req.userId);
            res.json(books);
        }
        catch (error) {
            next(error);
        }
    }
    async getBookById(req, res, next) {
        try {
            const { id } = req.params;
            const book = await booksService.getBookById(id, req.userId);
            res.json(book);
        }
        catch (error) {
            next(error);
        }
    }
    async createBook(req, res, next) {
        try {
            const data = req.body;
            const book = await booksService.createBook(req.userId, data);
            res.status(201).json(book);
        }
        catch (error) {
            next(error);
        }
    }
    async updateBook(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const book = await booksService.updateBook(id, req.userId, data);
            res.json(book);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteBook(req, res, next) {
        try {
            const { id } = req.params;
            await booksService.deleteBook(id, req.userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async getReadBooks(req, res, next) {
        try {
            const books = await booksService.getBooksByStatus(req.userId, 'read');
            res.json(books);
        }
        catch (error) {
            next(error);
        }
    }
    async getWishlistBooks(req, res, next) {
        try {
            const books = await booksService.getBooksByStatus(req.userId, 'want-to-read');
            res.json(books);
        }
        catch (error) {
            next(error);
        }
    }
    async getStatistics(req, res, next) {
        try {
            const stats = await booksService.getStatistics(req.userId);
            res.json(stats);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BooksController = BooksController;
