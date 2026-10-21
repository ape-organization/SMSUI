import { computed, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { readJson, writeJson } from '../utils/storage';
import { ar } from './ar';
import { en } from './en';
import { Language, TranslationKey, TranslationParams, Translations } from './i18n.types';

export const DEFAULT_LANGUAGE: Language = 'ar';

const STORAGE_KEY = 'sms.language';
const DICTIONARIES: Record<Language, Translations> = { ar, en };

/** Runtime language switching; keeps <html lang/dir> in sync for RTL layout. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly _language = signal(this.initialLanguage());

  readonly language = this._language.asReadonly();
  readonly direction = computed(() => (this._language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    this.applyToDocument();
  }

  setLanguage(language: Language): void {
    this._language.set(language);
    writeJson(localStorage, STORAGE_KEY, language);
    this.applyToDocument();
  }

  toggle(): void {
    this.setLanguage(this._language() === 'ar' ? 'en' : 'ar');
  }

  /** Arrow function so it can be passed around as a plain callback. */
  readonly translate = (key: TranslationKey, params?: TranslationParams): string => {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        DICTIONARIES[this._language()],
      );
    if (typeof value !== 'string') return key;
    return params
      ? value.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match))
      : value;
  };

  private initialLanguage(): Language {
    const stored = readJson<Language>(localStorage, STORAGE_KEY);
    return stored && stored in DICTIONARIES ? stored : DEFAULT_LANGUAGE;
  }

  private applyToDocument(): void {
    const html = this.document.documentElement;
    html.lang = this._language();
    html.dir = this.direction();
  }
}
