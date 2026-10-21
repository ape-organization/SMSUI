import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { APP_ROUTES } from '../constants';
import { SessionStore } from './session.store';

/** Attaches the bearer token and signs the user out when it is rejected. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(SessionStore);
  const router = inject(Router);
  const token = store.token();

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        token &&
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.Unauthorized
      ) {
        store.clear();
        void router.navigateByUrl(APP_ROUTES.login);
      }
      return throwError(() => error);
    }),
  );
};
