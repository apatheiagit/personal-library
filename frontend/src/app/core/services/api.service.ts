import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  
  private baseUrl = 'http://localhost:3000/api';
  private readonly DEFAULT_TIMEOUT = 10000;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    });
  }

  private handleError(error: HttpErrorResponse, operation: string) {
    let errorMessage = 'Произошла ошибка';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Ошибка: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Нет соединения с сервером';
          break;
        case 401:
          errorMessage = 'Не авторизован. Пожалуйста, войдите снова';
          this.authService.logout();
          break;
        case 403:
          errorMessage = 'Доступ запрещен';
          break;
        case 404:
          errorMessage = 'Ресурс не найден';
          break;
        case 500:
          errorMessage = 'Внутренняя ошибка сервера';
          break;
        default:
          errorMessage = error.error?.message || `Ошибка ${error.status}: ${error.message}`;
      }
    }
    
    this.toastService.error('Ошибка', errorMessage);
    console.error(`${operation} failed:`, error);
    
    return throwError(() => error);
  }

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${url}`, { headers: this.getHeaders() })
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        catchError(error => this.handleError(error, `GET ${url}`)),
      );
  }

  post<T>(url: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${url}`, data, { headers: this.getHeaders() })
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        catchError(error => this.handleError(error, `POST ${url}`)),
      );
  }

  put<T>(url: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${url}`, data, { headers: this.getHeaders() })
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        catchError(error => this.handleError(error, `PUT ${url}`)),
      );
  }

  patch<T>(url: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${url}`, data, { headers: this.getHeaders() })
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        catchError(error => this.handleError(error, `PATCH ${url}`)),
      );
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${url}`, { headers: this.getHeaders() })
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        catchError(error => this.handleError(error, `DELETE ${url}`)),
      );
  }
}