import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { Book, ReadingStatus } from '../../core/models/book.model';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  loading = false;
  searchTerm = '';
  private subscription = new Subscription();
  private bookService = inject(BookService);
  
  ngOnInit(): void {
    this.subscription.add(
      this.bookService.loading$.subscribe(loading => this.loading = loading)
    );
    
    this.subscription.add(
      this.bookService.getWishlistBooks().subscribe(books => {
        this.books = books;
        this.applyFilter();
      })
    );
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredBooks = this.books;
    } else {
      this.filteredBooks = this.books.filter(book => 
        book.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  deleteBook(id: string): void {
    if (confirm('Удалить книгу из списка желаний?')) {
      this.bookService.deleteBook(id).subscribe();
    }
  }

  moveToRead(id: string): void {
    this.bookService.changeStatus(id, ReadingStatus.READ).subscribe({
      next: () => {
        alert('Книга перемещена в "Прочитанные". Не забудьте добавить оценку и отзыв!');
      },
      error: (error) => console.error('Ошибка:', error)
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}