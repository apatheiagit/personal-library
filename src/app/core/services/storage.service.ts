import { Injectable } from '@angular/core';
import { Book } from '../models/book.model';

const STORAGE_KEY = 'personal_library';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  getBooks(): Book[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const books = JSON.parse(data);

    return books.map((book: any) => ({
      ...book,
      addedDate: new Date(book.addedDate)
    }));
  }

  saveBooks(books: Book[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }

  clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}