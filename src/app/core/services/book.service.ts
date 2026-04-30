import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of, combineLatest } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay, filter } from 'rxjs/operators';
import { Book, NewBook, ReadingStatus, UpdateBook, BookFilters } from '../models/book.model';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  private refreshTrigger = new BehaviorSubject<void>(undefined);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  loading$ = this.loadingSubject.asObservable();
  
  books$: Observable<Book[]> = this.refreshTrigger.pipe(
    tap(() => {
      this.loadingSubject.next(true);
    }),
    switchMap(() => this.apiService.getBooks().pipe(
      catchError(error => {
        this.toastService.showHttpError(error, 'Не удалось загрузить книги');
        return of([]);
      }),
    )),
    tap(() => this.loadingSubject.next(false)),
    shareReplay(1),
  );
  
  readBooks$: Observable<Book[]> = this.books$.pipe(
    map(books => books.filter(book => book.status === ReadingStatus.READ).sort((a, b) => (b.year ?? 0) - (a.year ?? 0))),
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
        this.toastService.showHttpError(error, `Не удалось загрузить книгу с ID ${id}`);
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
        this.toastService.showHttpError(error, `Не удалось добавить книгу "${newBook.title}"`)
        return throwError(() => error);
      }),
    );
  }

  updateBook(id: string, updatedBook: Book): Observable<Book> {
    return this.apiService.updateBook(id, updatedBook).pipe(
      tap(() => this.refresh()),
      catchError(error => {
        this.toastService.showHttpError(error, `Не удалось обновить книгу "${updatedBook.title}"`);
        return throwError(() => error);
      }),
    );
  }

  patchBook(id: string, updates: UpdateBook): Observable<Book> {
    return this.apiService.patchBook(id, updates).pipe(
      tap(() => this.refresh()),
      catchError(error => {
        this.toastService.showHttpError(error, `Не удалось обновить книгу`);
        return throwError(() => error);
      }),
    );
  }

  deleteBook(id: string): Observable<void> {
    return this.apiService.deleteBook(id).pipe(
      tap(() => this.refresh()),
      catchError(error => {
        this.toastService.showHttpError(error, `Не удалось удалить книгу`);
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

}