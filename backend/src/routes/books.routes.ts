import { Router } from 'express';
import { BooksController } from '../controllers/books.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const booksController = new BooksController();

// Все маршруты требуют авторизации
router.use(authenticate);

router.get('/', booksController.getAllBooks.bind(booksController));
router.get('/read', booksController.getReadBooks.bind(booksController));
router.get('/wishlist', booksController.getWishlistBooks.bind(booksController));
router.get('/statistics', booksController.getStatistics.bind(booksController));
router.get('/:id', booksController.getBookById.bind(booksController));
router.post('/', booksController.createBook.bind(booksController));
router.put('/:id', booksController.updateBook.bind(booksController));
router.delete('/:id', booksController.deleteBook.bind(booksController));

export default router;