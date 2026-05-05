import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { combineLatest, filter, map, shareReplay, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { BookService } from '../../core/services/book.service';
import { FilterService } from '../../core/services/filter.service';
import { PaginationService } from '../../core/services/pagination.service';
import { ToastService } from '../../core/services/toast.service';
import { Rating, ReadingStatus } from '../../core/models/book.model';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { BookCardComponent } from '../../shared/book-card/book-card.component';
import { DialogComponent } from '../../shared/dialog/dialog.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent, BookCardComponent, MatButtonModule,
    MatSelectModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatExpansionModule,
   ],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookListComponent implements OnInit{
  readonly dialog = inject(MatDialog);
  private bookService = inject(BookService);
  private filterService = inject(FilterService);
  private paginationService = inject(PaginationService);
  private toastService = inject(ToastService);

  loading$ = this.bookService.loading$;
  books$ = this.bookService.filterBooks(this.filterService.filters$);
  readonly panelOpenState = signal(false);
  
  private filteredBooks$ = combineLatest([
    this.bookService.readBooks$,
    this.filterService.filters$,
  ]).pipe(
    map(([books, filters]) => {
      return books.filter(book => {
        let matches = true;
        
        if (filters.searchTitle && filters.searchTitle.trim()) {
          matches = matches && book.title.toLowerCase().includes(filters.searchTitle.toLowerCase());
        }
        
        if (filters.searchAuthor && filters.searchAuthor.trim()) {
          matches = matches && book.author.toLowerCase().includes(filters.searchAuthor.toLowerCase());
        }
        
        if (filters.rating) {
          matches = matches && book.rating === filters.rating;
        }
        
        return matches;
      });
    }),
    shareReplay(1),
  );
  hasActiveFilters$ = this.filterService.hasActiveFilters$;
  paginatedBooks$ = this.paginationService.getPaginationState(this.filteredBooks$);
  totalCount$ = this.filteredBooks$.pipe(
    map(books => books.length),
  );

   ngOnInit(): void {
    this.filterService.filters$.subscribe(() => {
      this.paginationService.resetPagination();
    });
  }

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

  onPageChange(page: number): void {
    this.paginationService.setCurrentPage(page);
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.paginationService.setItemsPerPage(itemsPerPage);
  }

  moveToWishlist(id: string): void {
    const book = (this.bookService.readBooks$ as any).source['_value']?.find((b: any) => b.id === id);
    const bookTitle = book?.title || 'Книга';

    this.bookService.changeStatus(id, ReadingStatus.WANT_TO_READ).subscribe({
      next: () => {
        this.toastService.info(
          'Статус изменен', 
          `"${bookTitle}" перемещена в список желаемых`,
          5000,
        );
      },
    });
  }

  openDeleteDialog(id: string): void {
    const book = (this.bookService.readBooks$ as any).source['_value']?.find((b: any) => b.id === id);
    const bookTitle = book?.title || 'Книга';

    const dialogRef = this.dialog.open(
      DialogComponent, 
      {
        data: {
          title: 'Удаление',
          message: 'Вы уверены, что хотите удалить эту книгу?',
        },
      },
    );
    dialogRef.afterClosed()
      .pipe(
        filter(x => !!x),
        switchMap(() => this.bookService.deleteBook(id)),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Книга удалена', `"${bookTitle}" удалена из библиотеки`);
        },
      });
  }
  
}