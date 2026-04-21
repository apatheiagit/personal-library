import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { BookService } from '../services/book.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private bookService = inject(BookService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        
        if (error.error instanceof ErrorEvent) {
          // Клиентская ошибка
          errorMessage = `Ошибка: ${error.error.message}`;
        } else {
          // Серверная ошибка
          errorMessage = `Код ошибки: ${error.status}\nСообщение: ${error.message}`;
          
          // Логика для специфичных статусов
          if (error.status === 404) {
            errorMessage = 'Ресурс не найден';
          } else if (error.status === 500) {
            errorMessage = 'Внутренняя ошибка сервера';
          } else if (error.status === 0) {
            errorMessage = 'Нет соединения с сервером. Убедитесь, что json-server запущен';
          }
        }
        
        this.bookService['errorSubject'].next(errorMessage);
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}