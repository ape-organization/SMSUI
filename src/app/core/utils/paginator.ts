import { computed, Signal, signal } from '@angular/core';

/**
 * Client-side pagination over a list signal.
 * Create it in a field initializer after the list, then render `pageItems()`.
 */
export class Paginator<T> {
  private readonly requestedPage = signal(1);

  readonly total = computed(() => this.items().length);
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  /** Clamped, so deleting the last row of the last page falls back to the previous page. */
  readonly page = computed(() => Math.min(this.requestedPage(), this.pageCount()));
  /** 1-based index of the first row on the page (0 when the list is empty). */
  readonly from = computed(() => (this.total() ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly to = computed(() => Math.min(this.page() * this.pageSize, this.total()));

  readonly pageItems = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.items().slice(start, start + this.pageSize);
  });

  constructor(
    private readonly items: Signal<readonly T[]>,
    readonly pageSize = 10,
  ) {}

  goTo(page: number): void {
    this.requestedPage.set(Math.min(Math.max(1, page), this.pageCount()));
  }
}
