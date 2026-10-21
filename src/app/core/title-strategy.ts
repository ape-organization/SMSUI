import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { I18nService } from './i18n/i18n.service';
import { TranslationKey } from './i18n/i18n.types';

/** Route `title` values are translation keys; the document title follows the active language. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly pageKey = signal<TranslationKey | undefined>(undefined);

  constructor() {
    super();
    effect(() => {
      const appName = this.i18n.translate('app.name');
      const key = this.pageKey();
      this.title.setTitle(key ? `${this.i18n.translate(key)} · ${appName}` : appName);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageKey.set(this.buildTitle(snapshot) as TranslationKey | undefined);
  }
}
