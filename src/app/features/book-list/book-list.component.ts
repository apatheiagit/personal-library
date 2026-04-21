import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { FilterService } from '../../core/services/filter.service';
import { Rating, ReadingStatus } from '../../core/models/book.model';
import { ErrorDisplayComponent } from '../../shared/error-display/error-display.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ErrorDisplayComponent],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookListComponent {
  private bookService = inject(BookService);
  private filterService = inject(FilterService);

  loading$ = this.bookService.loading$;
  books$ = this.bookService.filterBooks(this.filterService.filters$);
  
  filteredBooks$ = this.bookService.filterBooks(this.filterService.filters$);
  hasActiveFilters$ = this.filterService.hasActiveFilters$;

  onTitleSearch(title: string): void {
    this.filterService.setTitle(title);
  }

  onAuthorSearch(author: string): void {
    this.filterService.setAuthor(author);
  }

  onRatingChange(rating: string): void {
    const ratingValue = rating ? (parseInt(rating) as Rating) : undefined;
    this.filterService.setRating(ratingValue);
  }

  clearFilters(): void {
    this.filterService.clearFilters();
  }

  deleteBook(id: string): void {
    if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
      this.bookService.deleteBook(id).subscribe();
    }
  }

  moveToWishlist(id: string): void {
    this.bookService.changeStatus(id, ReadingStatus.WANT_TO_READ).subscribe();
  }

  getStarArray(rating?: number): number[] {
    return rating ? Array(rating).fill(0) : [];
  }
}