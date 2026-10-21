import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { APP_ROUTES } from '../constants';
import { SessionStore } from './session.store';

const redirectTo = (url: string) => inject(Router).parseUrl(url);

/** Only signed-in users. */
export const authGuard: CanActivateFn = () =>
  inject(SessionStore).isAuthenticated() || redirectTo(APP_ROUTES.login);

/** Only guests — signed-in users skip the auth pages. */
export const guestGuard: CanActivateFn = () =>
  !inject(SessionStore).isAuthenticated() || redirectTo(APP_ROUTES.dashboard);

/** Only users who logged in with a temporary password. */
export const passwordChangeGuard: CanActivateFn = () =>
  inject(SessionStore).challenge()?.requiresPasswordChange === true ||
  redirectTo(APP_ROUTES.login);

/** Only users who passed the password step and are awaiting an OTP. */
export const otpGuard: CanActivateFn = () =>
  inject(SessionStore).challenge()?.requiresPasswordChange === false ||
  redirectTo(APP_ROUTES.login);
