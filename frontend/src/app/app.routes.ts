import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent),
    canActivate: [GuestGuard],
  },
  {
    path: 'books',
    loadComponent: () => import('./features/book-list/book-list.component')
      .then(m => m.BookListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./features/wishlist/wishlist.component')
      .then(m => m.WishlistComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'book/add',
    loadComponent: () => import('./features/book-form/book-form.component')
      .then(m => m.BookFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'book/edit/:id',
    loadComponent: () => import('./features/book-form/book-form.component')
      .then(m => m.BookFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'statistics',
    loadComponent: () => import('./features/statistics/statistics.component')
      .then(m => m.StatisticsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: '',
    redirectTo: '/books',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/books',
  },
];