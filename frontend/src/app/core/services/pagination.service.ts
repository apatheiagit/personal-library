import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  private currentPageSubject = new BehaviorSubject<number>(1);
  private itemsPerPageSubject = new BehaviorSubject<number>(9);
  
  currentPage$ = this.currentPageSubject.asObservable().pipe(
    distinctUntilChanged(),
  );
  
  itemsPerPage$ = this.itemsPerPageSubject.asObservable().pipe(
    distinctUntilChanged(),
  );


  setCurrentPage(page: number): void {
    this.currentPageSubject.next(page);
  }

  setItemsPerPage(itemsPerPage: number): void {
    this.itemsPerPageSubject.next(itemsPerPage);
    this.setCurrentPage(1);
  }

  getPaginationState<T>(items$: Observable<T[]>): Observable<{
    paginatedItems: T[];
    paginationState: PaginationState;
  }> {
    return combineLatest([
      items$,
      this.currentPage$,
      this.itemsPerPage$,
    ]).pipe(
      map(([items, currentPage, itemsPerPage]) => {
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        const validPage = Math.min(Math.max(1, currentPage), totalPages || 1);
        
        if (validPage !== currentPage) {
          this.setCurrentPage(validPage);
        }
        
        const startIndex = (validPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = items.slice(startIndex, endIndex);
        
        return {
          paginatedItems,
          paginationState: {
            currentPage: validPage,
            itemsPerPage,
            totalItems,
            totalPages,
          },
        };
      }),
    );
  }

  resetPagination(): void {
    this.setCurrentPage(1);
  }
}