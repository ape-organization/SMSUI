import { ValidatorFn } from '@angular/forms';

/** `YYYY-MM-DD` in local time — the value format of `<input type="date">`. */
export function toDateInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Tomorrow as a date-input value; the earliest date accepted by `futureDateValidator`. */
export function tomorrowDateInputValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

/** Empty values pass (pair with `Validators.required` when needed); dates must be after today. */
export const futureDateValidator: ValidatorFn = (control) => {
  const value = control.value as string | null;
  return value && value < tomorrowDateInputValue() ? { futureDate: true } : null;
};
