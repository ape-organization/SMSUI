import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, take } from 'rxjs';

import { TranslatePipe } from './core/i18n/translate.pipe';
import { LoaderService } from './core/loader/loader.service';
import { Loader } from './shared/ui/loader/loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe, Loader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  /**
   * True until the first page has loaded — keeps the splash from index.html on screen while the
   * lazy route chunks download. A guard redirect cancels and restarts, so only End/Error count.
   */
  protected readonly booting = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd || event instanceof NavigationError),
      take(1),
      map(() => false),
    ),
    { initialValue: true },
  );

  constructor() {
    // Later page changes show the global loader while their lazy chunk downloads.
    const loader = inject(LoaderService);
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError ||
            event instanceof NavigationSkipped,
        ),
        takeUntilDestroyed(),
      )
      .subscribe((event) => loader.setNavigating(event instanceof NavigationStart));
  }
}
