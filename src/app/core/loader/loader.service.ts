import { computed, Injectable, signal } from '@angular/core';
import { defer, finalize, Observable } from 'rxjs';

/**
 * Global busy state behind <app-loader>. Every API call is counted automatically by
 * loaderInterceptor; use show()/hide() or track() for anything else that should block the UI.
 */
@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly pending = signal(0);
  private readonly navigating = signal(false);

  /** True while any tracked work (requests, manual calls, page loads) is unfinished. */
  readonly active = computed(() => this.pending() > 0 || this.navigating());

  /** Starts one unit of work. Every show() must be matched by exactly one hide(). */
  show(): void {
    this.pending.update((count) => count + 1);
  }

  hide(): void {
    this.pending.update((count) => Math.max(0, count - 1));
  }

  /** Keeps the loader up from subscription until the observable completes, errors or is cancelled. */
  track<T>(source: Observable<T>): Observable<T> {
    return defer(() => {
      this.show();
      return source.pipe(finalize(() => this.hide()));
    });
  }

  /** Set by the root component while a lazy page is loading. */
  setNavigating(navigating: boolean): void {
    this.navigating.set(navigating);
  }
}
