import { Routes } from '@angular/router';

import { otpGuard, passwordChangeGuard } from '../../core/auth/auth.guards';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'change-password',
    canActivate: [passwordChangeGuard],
    loadComponent: () => import('./change-password/change-password').then((m) => m.ChangePassword),
  },
  {
    path: 'verify-otp',
    canActivate: [otpGuard],
    loadComponent: () => import('./verify-otp/verify-otp').then((m) => m.VerifyOtp),
  },
];
