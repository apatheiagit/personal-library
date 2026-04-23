import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationState } from '../../core/services/pagination.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() paginationState!: PaginationState;
  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();
  
  itemsPerPageOptions = [10, 20, 50];

  readonly minItemsPerPage = 10;
  
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
  
  onItemsPerPageChange(value: number): void {
    this.itemsPerPageChange.emit(value);
  }

  getStartIndex(): number {
    return (this.paginationState.currentPage - 1) * this.paginationState.itemsPerPage + 1;
  }
  
  getEndIndex(): number {
    return Math.min(
      this.paginationState.currentPage * this.paginationState.itemsPerPage,
      this.paginationState.totalItems
    );
  }
  
  isDot(page: number): boolean {
    return page === -1;
  }
}