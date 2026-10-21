import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

import { AuthService } from '../../core/auth/auth.service';
import { APP_ROUTES } from '../../core/constants';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslationKey } from '../../core/i18n/i18n.types';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

interface NavItem {
  label: TranslationKey;
  path: string;
  /** Material Symbols icon name. */
  icon: string;
}

// Add an entry here when its feature route is created.
const NAV_ITEMS: readonly NavItem[] = [
  { label: 'nav.dashboard', path: APP_ROUTES.dashboard, icon: 'dashboard' },
  { label: 'nav.users', path: APP_ROUTES.users, icon: 'group' },
  { label: 'nav.apiIntegration', path: APP_ROUTES.apiIntegration, icon: 'api' },
];

/** Authenticated layout: navy sidebar (drawer on mobile) + sticky topbar + routed content. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  host: { '(document:keydown.escape)': 'menuOpen.set(false)' },
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly i18n = inject(I18nService);
  protected readonly navItems = NAV_ITEMS;
  protected readonly year = new Date().getFullYear();
  protected readonly user = this.auth.user;
  protected readonly menuOpen = signal(false);

  protected readonly initials = computed(() =>
    (this.user()?.name ?? '')
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  private readonly routeTitleKey = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.currentRouteTitle()),
    ),
  );

  protected readonly pageTitle = computed(() => {
    const key = this.routeTitleKey();
    return key ? this.i18n.translate(key) : '';
  });

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl(APP_ROUTES.login);
  }

  private currentRouteTitle(): TranslationKey | undefined {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    return route.title as TranslationKey | undefined;
  }
}
