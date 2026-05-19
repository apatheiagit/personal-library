import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { BooksService } from '../services/books.service';
import { CreateBookDTO, UpdateBookDTO } from '../types';

const booksService = new BooksService();

export class BooksController {
  async getAllBooks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const books = await booksService.getAllBooks(req.userId!);
      res.json(books);
    } catch (error) {
      next(error);
    }
  }

  async getBookById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const book = await booksService.getBookById(id, req.userId!);
      res.json(book);
    } catch (error) {
      next(error);
    }
  }

  async createBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: CreateBookDTO = req.body;
      const book = await booksService.createBook(req.userId!, data);
      res.status(201).json(book);
    } catch (error) {
      next(error);
    }
  }

  async updateBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateBookDTO = req.body;
      const book = await booksService.updateBook(id, req.userId!, data);
      res.json(book);
    } catch (error) {
      next(error);
    }
  }

  async patchBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateBookDTO = req.body;
      const book = await booksService.patchBook(id, req.userId!, data);
      res.json(book);
    } catch (error) {
      next(error);
    }
  }

  async deleteBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await booksService.deleteBook(id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getReadBooks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const books = await booksService.getBooksByStatus(req.userId!, 'read');
      res.json(books);
    } catch (error) {
      next(error);
    }
  }

  async getWishlistBooks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const books = await booksService.getBooksByStatus(req.userId!, 'want-to-read');
      res.json(books);
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await booksService.getStatistics(req.userId!);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}