export enum ReadingStatus {
  READ = 'read',
  WANT_TO_READ = 'want-to-read'
}

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Book {
  id: string;
  title: string;
  author: string;
  year?: number | null;
  rating?: Rating;
  personalReview?: string;
  status: ReadingStatus;
  addedDate: string;
}

export type NewBook = Omit<Book, 'id' | 'addedDate'>;

export type UpdateBook = Partial<Omit<Book, 'id'>>;

export interface BookFilters {
  searchTitle: string;
  searchAuthor: string;
  rating?: Rating;
}
