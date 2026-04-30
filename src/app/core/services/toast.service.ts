import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  
  private readonly DEFAULT_DURATION = 3000;
  private readonly ERROR_DURATION = 5000;

  success(title: string, message: string, duration?: number): void {
    this.show({ 
      id: this.generateId(), 
      type: 'success', 
      title, 
      message, 
      duration: duration || this.DEFAULT_DURATION, 
    });
  }

  error(title: string, message: string, duration?: number): void {
    this.show({ 
      id: this.generateId(), 
      type: 'error', 
      title, 
      message, 
      duration: duration || this.ERROR_DURATION, 
    });
  }

  info(title: string, message: string, duration?: number): void {
    this.show({ 
      id: this.generateId(), 
      type: 'info', 
      title, 
      message, 
      duration: duration || this.DEFAULT_DURATION, 
    });
  }

  warning(title: string, message: string, duration?: number): void {
    this.show({ 
      id: this.generateId(), 
      type: 'warning', 
      title, 
      message, 
      duration: duration || this.DEFAULT_DURATION,
    });
  }

  showHttpError(error: any, defaultMessage = 'Произошла ошибка'): void {
    let errorMessage = defaultMessage;
    
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    this.error('Ошибка', errorMessage);
  }

  private show(toast: Toast): void {
    const currentToasts = this.toastsSubject.getValue();
    this.toastsSubject.next([...currentToasts, toast]);
    
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }
  }

  remove(id: string): void {
    const currentToasts = this.toastsSubject.getValue();
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }

  clearAll(): void {
    this.toastsSubject.next([]);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 6);
  }
}