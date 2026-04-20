import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book, UpdateBook } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/books';

  constructor(private http: HttpClient) {}

  // Получить все книги
  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.baseUrl);
  }

  // Получить книгу по ID
  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/${id}`);
  }

  // Добавить книгу (POST)
  addBook(book: Omit<Book, 'id'>): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, book);
  }

  // Обновить книгу (PUT - полное обновление)
  updateBook(id: string, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, book);
  }

  // Частичное обновление (PATCH)
  patchBook(id: string, updates: UpdateBook): Observable<Book> {
    return this.http.patch<Book>(`${this.baseUrl}/${id}`, updates);
  }

  // Удалить книгу
  deleteBook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Фильтрация через query parameters
  getFilteredBooks(filters: { title?: string; author?: string; rating?: number; status?: string }): Observable<Book[]> {
    let params = new HttpParams();
    
    if (filters.title) params = params.append('title_like', filters.title);
    if (filters.author) params = params.append('author_like', filters.author);
    if (filters.rating) params = params.append('rating', filters.rating.toString());
    if (filters.status) params = params.append('status', filters.status);
    
    return this.http.get<Book[]>(this.baseUrl, { params });
  }
}