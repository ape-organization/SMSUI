import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Paginator } from '../../../core/utils/paginator';

/** Page numbers to show; `null` marks a gap ("…"). Always includes first, last and neighbours. */
function visiblePages(current: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);

  const pages = [1, current - 1, current, current + 1, count]
    .filter((page, i, all) => page >= 1 && page <= count && all.indexOf(page) === i)
    .sort((a, b) => a - b);

  return pages.flatMap((page, i) => (i > 0 && page - pages[i - 1] > 1 ? [null, page] : [page]));
}

/** Table footer: "Showing 1–10 of 23" + page navigation. */
@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  host: { class: 'pagination' },
})
export class Pagination {
  readonly paginator = input.required<Paginator<unknown>>();

  protected readonly pages = computed(() =>
    visiblePages(this.paginator().page(), this.paginator().pageCount()),
  );
}
