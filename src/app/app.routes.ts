import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'users',
        title: 'routes.users',
        loadComponent: () => import('./features/users/all-users/users').then((m) => m.Users),
      },
      {
        path: 'api-integration',
        title: 'routes.apiIntegration',
        loadComponent: () =>
          import('./features/api-integration/all-api-integration/api-integration').then((m) => m.ApiIntegration),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
