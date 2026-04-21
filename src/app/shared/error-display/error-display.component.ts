import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../core/services/book.service';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-display.component.html',
  styleUrls: ['./error-display.component.css']
})
export class ErrorDisplayComponent {
  private bookService = inject(BookService);
  error$ = this.bookService.error$;

  clearError(): void {
    this.bookService.clearError();
  }
}