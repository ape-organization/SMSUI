import { HttpErrorResponse } from '@angular/common/http';

import { TranslationKey } from '../i18n/i18n.types';

/**
 * Turns any thrown value into a message that is safe to show the user.
 * Server messages are used as-is (localised via Accept-Language); fallbacks are translated.
 */
export function getErrorMessage(error: unknown, translate: (key: TranslationKey) => string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return translate('errors.network');
    }
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message) {
      return message;
    }
    return translate(error.status >= 500 ? 'errors.server' : 'errors.generic');
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return translate('errors.unexpected');
}
