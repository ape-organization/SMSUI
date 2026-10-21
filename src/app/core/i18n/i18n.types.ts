import { en } from './en';

export type Language = 'ar' | 'en';

export type Translations = typeof en;

export type TranslationParams = Record<string, string | number>;

/** Dotted path to every string in the dictionary, e.g. `'login.heading'`. */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<Translations>;
