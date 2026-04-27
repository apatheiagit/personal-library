import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BookService } from '../../core/services/book.service';
import { ReadingStatus } from '../../core/models/book.model';
import { ErrorDisplayComponent } from '../../shared/error-display/error-display.component';
import { BookCardComponent } from '../../shared/book-card/book-card.component';
import { DialogComponent } from '../../shared/dialog/dialog.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, ErrorDisplayComponent, BookCardComponent, MatProgressSpinnerModule, MatButtonModule ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent {
  readonly dialog = inject(MatDialog);
  private bookService = inject(BookService);
  
  loading$ = this.bookService.loading$;
  error$ = this.bookService.error$;
  wishlistBooks$ = this.bookService.wishlistBooks$;
  

  moveToRead(id: string): void {
    this.bookService.changeStatus(id, ReadingStatus.READ).subscribe({
      next: () => {
        alert('Книга перемещена в "Прочитанные". Не забудьте добавить оценку и отзыв!');
      },
    });
  }

  clearError(): void {
    this.bookService.clearError();
  }

  openDeleteDialog(id: string): void {
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
      .subscribe();
  }
}