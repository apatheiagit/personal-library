import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import { BookFilters, Rating } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private titleSubject = new BehaviorSubject<string>('');
  private authorSubject = new BehaviorSubject<string>('');
  private ratingSubject = new BehaviorSubject<Rating | undefined>(undefined);
  
  title$ = this.titleSubject.asObservable().pipe(
    debounceTime(300),
    distinctUntilChanged()
  );
  
  author$ = this.authorSubject.asObservable().pipe(
    debounceTime(300),
    distinctUntilChanged()
  );
  
  rating$ = this.ratingSubject.asObservable().pipe(
    distinctUntilChanged()
  );
  
  filters$: Observable<BookFilters> = combineLatest([
    this.title$,
    this.author$,
    this.rating$
  ]).pipe(
    map(([searchTitle, searchAuthor, rating]): BookFilters => ({
      searchTitle,
      searchAuthor,
      rating
    })),
    shareReplay(1)
  );
  
  hasActiveFilters$ = this.filters$.pipe(
    map(filters => !!(filters.searchTitle || filters.searchAuthor || filters.rating))
  );

  setTitle(title: string): void {
    this.titleSubject.next(title);
  }

  setAuthor(author: string): void {
    this.authorSubject.next(author);
  }

  setRating(rating: Rating | undefined): void {
    this.ratingSubject.next(rating);
  }

  clearFilters(): void {
    this.titleSubject.next('');
    this.authorSubject.next('');
    this.ratingSubject.next(undefined);
  }
}