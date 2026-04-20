export enum ReadingStatus {
  READ = 'read',
  WANT_TO_READ = 'want-to-read'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year?: number | null;
  rating?: 1 | 2 | 3 | 4 | 5;
  personalReview?: string;
  status: ReadingStatus;
  addedDate: string;
}

export type NewBook = Omit<Book, 'id' | 'addedDate'>;

export type UpdateBook = Partial<Omit<Book, 'id'>>;

export interface BookFilters {
  searchTitle: string;
  searchAuthor: string;
  rating?: 1 | 2 | 3 | 4 | 5;
}
