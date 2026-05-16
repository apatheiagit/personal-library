import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, scan } from 'rxjs/operators';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];           
  newItems: T[];        
  paginationState: PaginationState;
}

const INITIAL_STATE = {
  items: [],
  newItems: [],
  paginationState: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasMore: false,
  }
};

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

  constructor() {
    this.setItemsPerPage(9);
  }

  setCurrentPage(page: number): void {
    this.currentPageSubject.next(page);
  }

  setItemsPerPage(itemsPerPage: number): void {
    this.itemsPerPageSubject.next(itemsPerPage);
    this.setCurrentPage(1);
  }

  loadMore(): void {
    const currentPage = this.currentPageSubject.getValue();
    this.setCurrentPage(currentPage + 1);
  }

  getPaginatedWithAccumulation<T>(items$: Observable<T[]>): Observable<PaginatedResult<T>> {
    return combineLatest([
      items$,
      this.currentPage$,
      this.itemsPerPage$,
    ]).pipe(
      scan((acc, [items, currentPage, itemsPerPage]) => {
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        const validPage = Math.min(Math.max(1, currentPage), totalPages || 1);
        
        const startIndex = (validPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageItems = items.slice(startIndex, endIndex);
        
        let accumulatedItems: T[];
        let newItems: T[];
        
        if (validPage === 1 || validPage < acc.paginationState?.currentPage) {
          accumulatedItems = currentPageItems;
          newItems = currentPageItems;
        } else if (validPage > (acc.paginationState?.currentPage || 0)) {
          const existingIds = new Set(acc.items.map(item => (item as any).id));
          newItems = currentPageItems.filter(item => !existingIds.has((item as any).id));
          accumulatedItems = [...acc.items, ...newItems];
        } else {
          accumulatedItems = currentPageItems;
          newItems = currentPageItems;
        }
        
        return {
          items: accumulatedItems,
          newItems: newItems,
          paginationState: {
            currentPage: validPage,
            itemsPerPage,
            totalItems,
            totalPages,
            hasMore: validPage < totalPages,
          },
        };
      },
      INITIAL_STATE as PaginatedResult<T>, 
      ),
    );
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
            hasMore: validPage < totalPages,
          },
        };
      }),
    );
  }

  resetPagination(): void {
    this.setCurrentPage(1);
  }
}