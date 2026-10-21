import { inject, Pipe, PipeTransform } from '@angular/core';

import { I18nService } from './i18n.service';
import { TranslationKey, TranslationParams } from './i18n.types';

/**
 * `{{ 'login.heading' | t }}` — impure so it re-evaluates when the language signal changes
 * (a dictionary lookup is cheap).
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.translate(key, params);
  }
}
