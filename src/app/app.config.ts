import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeAr from '@angular/common/locales/ar';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, TitleStrategy, withViewTransitions } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { mockApiInterceptor } from './core/http/mock-api.interceptor';
import { languageInterceptor } from './core/i18n/language.interceptor';
import { AppTitleStrategy } from './core/title-strategy';

// Arabic date/number formatting for DatePipe and DecimalPipe (English is built in).
registerLocaleData(localeAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withFetch(),
      // The mock backend must stay last so it sees headers added by earlier interceptors.
      withInterceptors([
        languageInterceptor,
        authInterceptor,
        ...(environment.useMockApi ? [mockApiInterceptor] : []),
      ]),
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // <mat-icon> renders Material Symbols (font loaded in index.html).
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
  ],
};
