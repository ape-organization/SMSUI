import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';

import { getErrorMessage } from '../http/http-error';
import { I18nService } from '../i18n/i18n.service';

/**
 * Tracks loading / error state for a component's requests.
 * Create it in a field initializer so it is tied to the component's lifetime.
 */
export class RequestState {
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Clears a previous error, e.g. when a dialog is reopened. */
  reset(): void {
    this._error.set(null);
  }

  run<T>(source: Observable<T>, onSuccess: (value: T) => void, onError?: () => void): void {
    this._loading.set(true);
    this._error.set(null);

    source
      .pipe(
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: onSuccess,
        error: (error: unknown) => {
          this._error.set(getErrorMessage(error, this.i18n.translate));
          onError?.();
        },
      });
  }
}
