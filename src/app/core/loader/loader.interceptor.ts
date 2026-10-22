import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { LoaderService } from './loader.service';

/**
 * Opt a request out of the global loader, e.g. background polling:
 * `http.get(url, { context: new HttpContext().set(SKIP_LOADER, true) })`.
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/** Shows <app-loader> until every in-flight API request has finished. */
export const loaderInterceptor: HttpInterceptorFn = (req, next) =>
  req.context.get(SKIP_LOADER) ? next(req) : inject(LoaderService).track(next(req));
