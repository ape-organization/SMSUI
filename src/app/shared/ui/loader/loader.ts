import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap, timer } from 'rxjs';

import { LoaderService } from '../../../core/loader/loader.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

/** Grace period before the overlay appears, so quick requests don't flash it. */
const SHOW_DELAY_MS = 200;

/** Full-screen busy overlay — place once (in App); it follows LoaderService.active(). */
@Component({
  selector: 'app-loader',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loader.html',
})
export class Loader {
  private readonly overlay = viewChild.required<ElementRef<HTMLElement>>('overlay');

  protected readonly visible = toSignal(
    toObservable(inject(LoaderService).active).pipe(
      distinctUntilChanged(),
      switchMap((active) => (active ? timer(SHOW_DELAY_MS).pipe(map(() => true)) : of(false))),
    ),
    { initialValue: false },
  );

  constructor() {
    effect(() => {
      const overlay = this.overlay().nativeElement;
      const visible = this.visible();
      if (!('showPopover' in overlay)) return; // very old browsers / test DOMs
      // Re-showing moves it above any dialog opened since it was last shown.
      if (overlay.matches(':popover-open')) overlay.hidePopover();
      if (visible) overlay.showPopover();
    });
  }
}
