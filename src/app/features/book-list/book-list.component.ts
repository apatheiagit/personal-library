import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { combineLatest, filter, map, shareReplay, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { BookService } from '../../core/services/book.service';
import { FilterService } from '../../core/services/filter.service';
import { PaginationService } from '../../core/services/pagination.service';
import { Rating, ReadingStatus } from '../../core/models/book.model';
import { ErrorDisplayComponent } from '../../shared/error-display/error-display.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { BookCardComponent } from '../../shared/book-card/book-card.component';
import { DialogComponent } from '../../shared/dialog/dialog.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ErrorDisplayComponent, PaginationComponent, BookCardComponent ],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookListComponent implements OnInit{
  readonly dialog = inject(MatDialog);
  private bookService = inject(BookService);
  private filterService = inject(FilterService);
  private paginationService = inject(PaginationService);

  loading$ = this.bookService.loading$;
  books$ = this.bookService.filterBooks(this.filterService.filters$);
  
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
    this.bookService.changeStatus(id, ReadingStatus.WANT_TO_READ).subscribe();
  }

  openDeleteDialog(id: string): void {
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
      .subscribe();
  }
  
}