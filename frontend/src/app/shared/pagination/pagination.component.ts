import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaginationState } from '../../core/services/pagination.service';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  @Input() paginationState!: PaginationState;
  @Input() loadedCount = 0;
  @Output() pageChange = new EventEmitter<number>();
  @Output() loadMore = new EventEmitter<void>();

  readonly minItemsPerPage = 9;
  
  get pages(): number[] {
    const { currentPage, totalPages } = this.paginationState;
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];
    let l: number;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    
    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push(-1);
        }
      }
      rangeWithDots.push(i);
      l = i;
    });
    
    return rangeWithDots;
  }
  
  onPageChange(page: number): void {
    if (page !== this.paginationState.currentPage && page >= 1 && page <= this.paginationState.totalPages) {
      this.pageChange.emit(page);
    }
  }

  getStartIndex(): number {
    return 1;
  }
  
  getEndIndex(): number {
    return this.loadedCount;
  }
  
  isDot(page: number): boolean {
    return page === -1;
  }

  onLoadMore(): void {
    this.loadMore.emit();
  }
}