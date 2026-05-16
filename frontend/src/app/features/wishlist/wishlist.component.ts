import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter, map, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookService } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';
import { PaginationService } from '../../core/services/pagination.service';
import { ReadingStatus } from '../../core/models/book.model';
import { BookCardComponent } from '../../shared/book-card/book-card.component';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, BookCardComponent, MatIconModule,
    MatProgressSpinnerModule, MatButtonModule, PaginationComponent ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent {
  readonly dialog = inject(MatDialog);
  private bookService = inject(BookService);
  private toastService = inject(ToastService);
  private paginationService = inject(PaginationService);
  
  loading$ = this.bookService.loading$;
  wishlistBooks$ = this.bookService.wishlistBooks$;
  paginatedResult$ = this.paginationService.getPaginatedWithAccumulation(this.wishlistBooks$);
  paginatedBooks$ = this.paginatedResult$.pipe(map(result => result.items));
  paginationState$ = this.paginatedResult$.pipe(map(result => result.paginationState));
  loadedCount$ = this.paginatedResult$.pipe(map(result => result.items.length));
  
  onPageChange(page: number): void {
    this.paginationService.setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onLoadMore(): void {
    this.paginationService.loadMore();
  }

  moveToRead(id: string): void {
    const book = (this.bookService.wishlistBooks$ as any).source['_value']?.find((b: any) => b.id === id);
    const bookTitle = book?.title || 'Книга';

    this.bookService.changeStatus(id, ReadingStatus.READ).subscribe({
      next: () => {
        this.toastService.info(
          'Статус изменен', 
          `"${bookTitle}" перемещена в "Прочитанные". Не забудьте добавить оценку и отзыв!`,
          5000,
        );
      },
    });
  }

  openDeleteDialog(id: string): void {
    const book = (this.bookService.wishlistBooks$ as any).source['_value']?.find((b: any) => b.id === id);
    const bookTitle = book?.title || 'Книга';

    const dialogRef = this.dialog.open(
      DialogComponent, 
      {
        data: {
          title: 'Удаление',
          message: 'Удалить книгу из списка желаний?',
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
          this.toastService.success('Книга удалена', `"${bookTitle}" удалена из списка желаний`);
        },
      });
  }
}