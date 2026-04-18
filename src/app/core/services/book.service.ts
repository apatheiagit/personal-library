import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Book, NewBook, ReadingStatus } from '../models/book.model';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private booksSubject = new BehaviorSubject<Book[]>([]);
  public books$ = this.booksSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.loadBooks();
  }

  private loadBooks(): void {
    const books = this.storageService.getBooks();
    this.booksSubject.next(books);
  }

  private saveBooks(books: Book[]): void {
    this.storageService.saveBooks(books);
    this.booksSubject.next(books);
  }

  getAllBooks(): Book[] {
    return this.booksSubject.getValue();
  }

  getReadBooks(): Observable<Book[]> {
    return this.books$.pipe(
      map(books => books.filter(book => book.status === ReadingStatus.READ))
    );
  }

  getWishlistBooks(): Observable<Book[]> {
    return this.books$.pipe(
      map(books => books.filter(book => book.status === ReadingStatus.WANT_TO_READ))
    );
  }

  getBookById(id: string): Book | undefined {
    return this.getAllBooks().find(book => book.id === id);
  }

  addBook(newBook: NewBook): void {
    const book: Book = {
      ...newBook,
      id: uuidv4(),
      addedDate: new Date()
    };
    
    const currentBooks = this.getAllBooks();
    this.saveBooks([...currentBooks, book]);
  }

  updateBook(updatedBook: Book): void {
    const currentBooks = this.getAllBooks();
    const index = currentBooks.findIndex(book => book.id === updatedBook.id);
    
    if (index !== -1) {
      currentBooks[index] = updatedBook;
      this.saveBooks([...currentBooks]);
    }
  }

  deleteBook(id: string): void {
    const currentBooks = this.getAllBooks();
    this.saveBooks(currentBooks.filter(book => book.id !== id));
  }

  changeStatus(id: string, newStatus: ReadingStatus): void {
    const book = this.getBookById(id);
    if (!book) return;

    let updatedBook: Book;
    
    if (newStatus === ReadingStatus.READ) {
      updatedBook = {
        ...book,
        status: newStatus,
        rating: undefined,
        personalReview: undefined
      };
    } else {
      const { rating, personalReview, ...rest } = book;
      updatedBook = {
        ...rest,
        status: newStatus
      };
    }
    
    this.updateBook(updatedBook);
  }

  getStatistics() {
    const books = this.getAllBooks();
    const readBooks = books.filter(b => b.status === ReadingStatus.READ);
    const wishlistBooks = books.filter(b => b.status === ReadingStatus.WANT_TO_READ);
    
    const ratings = readBooks.filter(b => b.rating).map(b => b.rating!);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;
    
    return {
      totalRead: readBooks.length,
      totalWishlist: wishlistBooks.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalBooks: books.length
    };
  }

  exportData(): string {
    return JSON.stringify(this.getAllBooks(), null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const books = JSON.parse(jsonData) as Book[];
      if (Array.isArray(books)) {
        this.saveBooks(books);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}