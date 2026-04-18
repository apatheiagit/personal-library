import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'books',
    loadComponent: () => import('./features/book-list/book-list.component')
      .then(m => m.BookListComponent)
  },
//   {
//     path: 'wishlist',
//     loadComponent: () => import('./features/wishlist/wishlist.component')
//       .then(m => m.WishlistComponent)
//   },
//   {
//     path: 'book/add',
//     loadComponent: () => import('./features/book-form/book-form.component')
//       .then(m => m.BookFormComponent)
//   },
//   {
//     path: 'book/edit/:id',
//     loadComponent: () => import('./features/book-form/book-form.component')
//       .then(m => m.BookFormComponent)
//   },
//   {
//     path: 'statistics',
//     loadComponent: () => import('./features/statistics/statistics.component')
//       .then(m => m.StatisticsComponent)
//   },
  {
    path: '',
    redirectTo: '/books',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/books'
  }
];