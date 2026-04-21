import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError, timeout } from 'rxjs';
import { Book, UpdateBook } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/books';
  private readonly DEFAULT_TIMEOUT = 10000;
  private http = inject(HttpClient);

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.baseUrl).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError(this.handleError<Book[]>('getBooks'))
    );
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/${id}`).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError(this.handleError<Book>(`getBookById id=${id}`))
    );
  }

  addBook(book: Omit<Book, 'id'>): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, book).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError(this.handleError<Book>('addBook'))
    );
  }

  updateBook(id: string, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, book).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError(this.handleError<Book>(`updateBook id=${id}`))
    );
  }

  patchBook(id: string, updates: UpdateBook): Observable<Book> {
    return this.http.patch<Book>(`${this.baseUrl}/${id}`, updates).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError(this.handleError<Book>(`patchBook id=${id}`))
    );
  }

  deleteBook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError(this.handleError<void>(`deleteBook id=${id}`))
    );
  }

  getFilteredBooks(filters: { title?: string; author?: string; rating?: number; status?: string }): Observable<Book[]> {
    let params = new HttpParams();
    
    if (filters.title) params = params.append('title_like', filters.title);
    if (filters.author) params = params.append('author_like', filters.author);
    if (filters.rating) params = params.append('rating', filters.rating.toString());
    if (filters.status) params = params.append('status', filters.status);
    
    return this.http.get<Book[]>(this.baseUrl, { params }).pipe(
      timeout(this.DEFAULT_TIMEOUT),      
      catchError(this.handleError<Book[]>('getFilteredBooks'))
    );
  }

   private handleError<T>(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<T> => {
      let errorMessage = 'Произошла ошибка';
      
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Ошибка клиента: ${error.error.message}`;
        console.error(`${operation} failed:`, error.error.message);
      } else {
        errorMessage = `Ошибка сервера ${error.status}: ${error.message}`;
        console.error(
          `${operation} failed: Backend returned code ${error.status}, ` +
          `body was:`, error.error
        );
      }
      
      this.logError(operation, errorMessage, error);
      
      return throwError(() => new Error(errorMessage));
    };
  }

  private logError(operation: string, message: string, error: HttpErrorResponse): void {
    console.error(`[API Error] ${operation}: ${message}`, error);
  }
}