import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, filter, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { BookService } from '../../core/services/book.service';
import { ReadingStatus } from '../../core/models/book.model';
import { ErrorDisplayComponent } from '../../shared/error-display/error-display.component';
import { BookCardComponent } from '../../shared/book-card/book-card.component';
import { DialogComponent } from '../../shared/dialog/dialog.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, ErrorDisplayComponent, BookCardComponent ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent {
  readonly dialog = inject(MatDialog);
  private bookService = inject(BookService);
  private searchSubject = new BehaviorSubject<string>('');
  
  loading$ = this.bookService.loading$;
  error$ = this.bookService.error$;
  
  searchTerm$ = this.searchSubject.asObservable().pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(''),
  );
  
  filteredBooks$ = combineLatest([
    this.bookService.wishlistBooks$,
    this.searchTerm$,
  ]).pipe(
    map(([books, searchTerm]) => {
      if (!searchTerm) return books;
      return books.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }),
  );
  
  booksCount$ = this.filteredBooks$.pipe(
    map(books => books.length),
  );

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  clearSearch(): void {
    this.searchSubject.next('');
  }

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