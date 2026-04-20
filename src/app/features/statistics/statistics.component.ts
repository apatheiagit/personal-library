import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../core/services/book.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit, OnDestroy {
  public bookService = inject(BookService);
  stats = {
    totalRead: 0,
    totalWishlist: 0,
    averageRating: 0,
    totalBooks: 0,
    byYear: {} as Record<number, number>
  };
  
  private subscription = new Subscription();

  ngOnInit(): void {
    this.subscription.add(
      this.bookService.books$.subscribe(() => {
        this.stats = this.bookService.getStatistics();
      })
    );
  }

  getYearEntries(): { year: number; count: number }[] {
    return Object.entries(this.stats.byYear)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}