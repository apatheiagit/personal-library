import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { BookService } from '../../core/services/book.service';
import { ErrorDisplayComponent } from '../../shared/error-display/error-display.component';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, ErrorDisplayComponent, MatButtonModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent {
  private bookService = inject(BookService);
  stats$ = this.bookService.statistics$;
  loading$ = this.bookService.loading$;
  error$ = this.bookService.error$;
  
  yearEntries$ = this.stats$.pipe(
    map(stats => 
      Object.entries(stats.byYear)
        .map(([year, count]) => ({ year: parseInt(year), count }))
        .sort((a, b) => b.year - a.year),
    ),
  );

  refresh(): void {
    this.bookService.refresh();
  }

  clearError(): void {
    this.bookService.clearError();
  }
}