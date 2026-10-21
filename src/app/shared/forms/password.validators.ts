import { ValidatorFn } from '@angular/forms';

import { TranslationKey } from '../../core/i18n/i18n.types';

export interface PasswordRule {
  key: string;
  label: TranslationKey;
  test: (value: string) => boolean;
}

/** Single source of truth for password policy — used by the validator and the checklist UI. */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  { key: 'length', label: 'changePassword.rules.length', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'changePassword.rules.upper', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'changePassword.rules.lower', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'changePassword.rules.number', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'changePassword.rules.special', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const passwordStrengthValidator: ValidatorFn = (control) =>
  PASSWORD_RULES.every((rule) => rule.test(control.value ?? ''))
    ? null
    : { passwordStrength: true };

/** Validates that this control equals its sibling `field`. */
export const matchFieldValidator =
  (field: string): ValidatorFn =>
  (control) => {
    const other = control.parent?.get(field);
    return other && control.value !== other.value ? { mismatch: true } : null;
  };
