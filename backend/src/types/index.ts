export interface User {
  id: string;
  email: string;
  name?: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year?: number | null;
  rating?: number | null;
  personalReview?: string | null;
  status: 'read' | 'want-to-read';
  addedDate: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookDTO {
  title: string;
  author: string;
  year?: number;
  rating?: number;
  personalReview?: string;
  status: 'read' | 'want-to-read';
}

export interface UpdateBookDTO {
  title?: string;
  author?: string;
  year?: number;
  rating?: number;
  personalReview?: string;
  status?: 'read' | 'want-to-read';
}

export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface RequestWithUser {
  userId?: string;
}