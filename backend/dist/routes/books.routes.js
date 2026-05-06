"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const books_controller_1 = require("../controllers/books.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const booksController = new books_controller_1.BooksController();
// Все маршруты требуют авторизации
router.use(auth_middleware_1.authenticate);
router.get('/', booksController.getAllBooks.bind(booksController));
router.get('/read', booksController.getReadBooks.bind(booksController));
router.get('/wishlist', booksController.getWishlistBooks.bind(booksController));
router.get('/statistics', booksController.getStatistics.bind(booksController));
router.get('/:id', booksController.getBookById.bind(booksController));
router.post('/', booksController.createBook.bind(booksController));
router.put('/:id', booksController.updateBook.bind(booksController));
router.delete('/:id', booksController.deleteBook.bind(booksController));
exports.default = router;
