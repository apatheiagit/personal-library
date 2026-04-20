import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { Book, ReadingStatus, BookFilters } from '../../core/models/book.model';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit, OnDestroy {
  public bookService = inject(BookService);
  books: Book[] = [];
  filteredBooks: Book[] = [];
  loading = false;
  private subscriptions = new Subscription();
  
  filters: BookFilters = {
    searchTitle: '',
    searchAuthor: '',
    rating: undefined
  };

  ngOnInit(): void {
    this.subscriptions.add(
      this.bookService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
    
    this.subscriptions.add(
      this.bookService.getReadBooks().subscribe(books => {
        this.books = books;
        this.applyFilters();
      })
    );
  }

  applyFilters(): void {
    this.filteredBooks = this.books.filter(book => {
      const matchTitle = this.filters.searchTitle === '' || 
        book.title.toLowerCase().includes(this.filters.searchTitle.toLowerCase());
      
      const matchAuthor = this.filters.searchAuthor === '' || 
        book.author.toLowerCase().includes(this.filters.searchAuthor.toLowerCase());
      
      const matchRating = !this.filters.rating || 
        book.rating === this.filters.rating;
      
      return matchTitle && matchAuthor && matchRating;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      searchTitle: '',
      searchAuthor: '',
      rating: undefined
    };
    this.applyFilters();
  }

  deleteBook(id: string): void {
    if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
      this.bookService.deleteBook(id).subscribe({
        error: (error) => console.error('Ошибка удаления:', error)
      });
    }
  }

  moveToWishlist(id: string): void {
    this.bookService.changeStatus(id, ReadingStatus.WANT_TO_READ).subscribe({
      error: (error) => console.error('Ошибка изменения статуса:', error)
    });
  }

  getStarArray(rating?: number): number[] {
    return rating ? Array(rating).fill(0) : [];
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}