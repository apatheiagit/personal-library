import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of, combineLatest } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay, filter } from 'rxjs/operators';
import { Book, NewBook, ReadingStatus, UpdateBook, BookFilters } from '../models/book.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private apiService = inject(ApiService);

  private refreshTrigger = new BehaviorSubject<void>(undefined);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  
  books$: Observable<Book[]> = this.refreshTrigger.pipe(
    tap(() => {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);
    }),
    switchMap(() => this.apiService.getBooks().pipe(
      catchError(error => {
        this.errorSubject.next(error.message);
        return of([]);
      }),
    )),
    tap(() => this.loadingSubject.next(false)),
    shareReplay(1),
  );
  
  readBooks$: Observable<Book[]> = this.books$.pipe(
    map(books => books.filter(book => book.status === ReadingStatus.READ)),
  );
  
  wishlistBooks$: Observable<Book[]> = this.books$.pipe(
    map(books => books.filter(book => book.status === ReadingStatus.WANT_TO_READ)),
  );
  
  statistics$ = this.books$.pipe(
    map(books => {
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
        byYear,
      };
    }),
    shareReplay(1),
  );

  getBookById(id: string): Observable<Book> {
    return this.books$.pipe(
      map(books => books.find(book => book.id === id)),
      filter(book => !!book),
      map(book => book!),
      catchError(error => {
        this.errorSubject.next(`Книга с id ${id} не найдена`);
        return throwError(() => error);
      }),
    );
  }

  addBook(newBook: NewBook): Observable<Book> {
    const bookToAdd = {
      ...newBook,
      addedDate: new Date().toISOString(),
    };
    
    return this.apiService.addBook(bookToAdd).pipe(
      tap(() => this.refresh()), 
      catchError(error => {
        this.errorSubject.next('Не удалось добавить книгу');
        return throwError(() => error);
      }),
    );
  }

  updateBook(id: string, updatedBook: Book): Observable<Book> {
    return this.apiService.updateBook(id, updatedBook).pipe(
      tap(() => this.refresh()),
      catchError(error => {
        this.errorSubject.next('Не удалось обновить книгу');
        return throwError(() => error);
      }),
    );
  }

  patchBook(id: string, updates: UpdateBook): Observable<Book> {
    return this.apiService.patchBook(id, updates).pipe(
      tap(() => this.refresh()),
      catchError(error => {
        this.errorSubject.next('Не удалось обновить книгу');
        return throwError(() => error);
      }),
    );
  }

  deleteBook(id: string): Observable<void> {
    return this.apiService.deleteBook(id).pipe(
      tap(() => this.refresh()),
      catchError(error => {
        this.errorSubject.next('Не удалось удалить книгу');
        return throwError(() => error);
      }),
    );
  }

  changeStatus(id: string, newStatus: ReadingStatus): Observable<Book> {
    let updates: UpdateBook = { status: newStatus };
    
    if (newStatus === ReadingStatus.READ) {
      updates = {
        ...updates,
        rating: undefined,
        personalReview: undefined,
      };
    }
    
    return this.patchBook(id, updates);
  }

  filterBooks(filters$: Observable<BookFilters>): Observable<Book[]> {
    return combineLatest([
      this.books$,
      filters$,
    ]).pipe(
      map(([books, filters]) => {
        return books.filter(book => {
          let matches = true;
          
          if (filters.searchTitle) {
            matches = matches && book.title.toLowerCase().includes(filters.searchTitle.toLowerCase());
          }
          
          if (filters.searchAuthor) {
            matches = matches && book.author.toLowerCase().includes(filters.searchAuthor.toLowerCase());
          }
          
          if (filters.rating) {
            matches = matches && book.rating === filters.rating;
          }
          
          return matches;
        });
      }),
    );
  }

  refresh(): void {
    this.refreshTrigger.next();
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  exportData(): Observable<string> {
    return this.books$.pipe(
      map(books => JSON.stringify(books, null, 2)),
      catchError(error => {
        this.errorSubject.next('Не удалось экспортировать данные');
        return throwError(() => error);
      }),
    );
  }

  importData(jsonData: string): Observable<boolean> {
    try {
      const books = JSON.parse(jsonData) as Book[];
      if (!Array.isArray(books)) {
        throw new Error('Неверный формат данных');
      }
      
      return this.deleteAllBooks().pipe(
        switchMap(() => this.importBooksSequentially(books)),
        map(() => true),
        catchError(error => {
          this.errorSubject.next('Не удалось импортировать данные');
          return throwError(() => error);
        }),
      );
    } catch (error) {
      this.errorSubject.next('Неверный формат JSON');
      return throwError(() => error);
    }
  }

  private deleteAllBooks(): Observable<void[]> {
    return this.books$.pipe(
      switchMap(books => {
        const deleteOperations = books.map(book => this.deleteBook(book.id));
        return deleteOperations.length > 0 
          ? combineLatest(deleteOperations)
          : of([]);
      }),
      map(() => []),
    );
  }

  private importBooksSequentially(books: Book[]): Observable<Book[]> {
    const importOperations = books.map(book => {
      const { id, ...bookWithoutId } = book;
      return this.addBook(bookWithoutId);
    });
    
    return importOperations.length > 0
      ? combineLatest(importOperations)
      : of([]);
  }
}