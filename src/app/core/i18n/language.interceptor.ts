import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { I18nService } from './i18n.service';

/** Lets the backend localise its messages and content. */
export const languageInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'Accept-Language': inject(I18nService).language() } }));
