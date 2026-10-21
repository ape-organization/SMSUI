import { AbstractControl } from '@angular/forms';

import { TranslationKey } from '../../core/i18n/i18n.types';

const ERROR_KEYS: Record<string, TranslationKey> = {
  required: 'validation.required',
  email: 'validation.email',
  passwordStrength: 'validation.passwordStrength',
  mismatch: 'validation.mismatch',
  futureDate: 'validation.futureDate',
};

/** Translation key for the first error of a touched control, or null when it should show none. */
export function fieldError(control: AbstractControl): TranslationKey | null {
  if (!control.touched || !control.errors) return null;
  const [key] = Object.keys(control.errors);
  return ERROR_KEYS[key] ?? 'validation.invalid';
}
