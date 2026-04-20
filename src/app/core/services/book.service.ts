import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Book, NewBook, ReadingStatus, UpdateBook } from '../models/book.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiService = inject(ApiService);
  private booksSubject = new BehaviorSubject<Book[]>([]);
  public books$ = this.booksSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loadingSubject.next(true);
    this.apiService.getBooks()
      .pipe(
        catchError(error => {
          console.error('Ошибка загрузки книг:', error);
          this.loadingSubject.next(false);
          return throwError(() => error);
        })
      )
      .subscribe(books => {
        this.booksSubject.next(books);
        this.loadingSubject.next(false);
      });
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

  getBookById(id: string): Observable<Book> {
    return this.apiService.getBookById(id);
  }

  addBook(newBook: NewBook): Observable<Book> {
    const bookToAdd = {
      ...newBook,
      addedDate: new Date().toISOString()
    };
    
    return this.apiService.addBook(bookToAdd).pipe(
      tap(addedBook => {
        const currentBooks = this.booksSubject.getValue();
        this.booksSubject.next([...currentBooks, addedBook]);
      })
    );
  }

  updateBook(id: string, updatedBook: Book): Observable<Book> {
    return this.apiService.updateBook(id, updatedBook).pipe(
      tap(book => {
        const currentBooks = this.booksSubject.getValue();
        const index = currentBooks.findIndex(b => b.id === id);
        if (index !== -1) {
          currentBooks[index] = book;
          this.booksSubject.next([...currentBooks]);
        }
      })
    );
  }

  patchBook(id: string, updates: UpdateBook): Observable<Book> {
    return this.apiService.patchBook(id, updates).pipe(
      tap(updatedBook => {
        const currentBooks = this.booksSubject.getValue();
        const index = currentBooks.findIndex(b => b.id === id);
        if (index !== -1) {
          currentBooks[index] = updatedBook;
          this.booksSubject.next([...currentBooks]);
        }
      })
    );
  }

  deleteBook(id: string): Observable<void> {
    return this.apiService.deleteBook(id).pipe(
      tap(() => {
        const currentBooks = this.booksSubject.getValue();
        this.booksSubject.next(currentBooks.filter(book => book.id !== id));
      })
    );
  }

  changeStatus(id: string, newStatus: ReadingStatus): Observable<Book> {
    let updates: UpdateBook = { status: newStatus };
    
    if (newStatus === ReadingStatus.READ) {
      updates = {
        ...updates,
        rating: undefined,
        personalReview: undefined
      };
    }
    
    return this.patchBook(id, updates);
  }

  filterBooks(filters: { title?: string; author?: string; rating?: number; status?: string }): Observable<Book[]> {
    this.loadingSubject.next(true);
    return this.apiService.getFilteredBooks(filters).pipe(
      tap(books => {
        this.booksSubject.next(books);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  getStatistics() {
    const books = this.booksSubject.getValue();
    const readBooks = books.filter(b => b.status === ReadingStatus.READ);
    const wishlistBooks = books.filter(b => b.status === ReadingStatus.WANT_TO_READ);
    
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

  refresh(): void {
    this.loadBooks();
  }
}