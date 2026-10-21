import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

import { AuthService } from '../../core/auth/auth.service';
import { getErrorMessage } from '../../core/http/http-error';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ActivityStatus, StatMetric, Tone } from '../../models/dashboard.models';
import { DashboardService } from '../../services/dashboard.service';

const STATUS_TONE: Record<ActivityStatus, Tone> = {
  success: 'green',
  info: 'blue',
  error: 'red',
};

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly dashboard = inject(DashboardService);

  protected readonly locale = this.i18n.language;
  protected readonly statusTone = STATUS_TONE;
  protected readonly placeholders = [1, 2, 3, 4];

  /** `undefined` while loading. Reloads when the language changes (content is server-localised). */
  protected readonly state = toSignal(
    toObservable(this.i18n.language).pipe(
      switchMap(() =>
        this.dashboard.getSummary().pipe(
          map((data) => ({ data, error: null })),
          catchError((error: unknown) =>
            of({ data: null, error: getErrorMessage(error, this.i18n.translate) }),
          ),
          startWith(undefined),
        ),
      ),
    ),
  );

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const greeting = this.i18n.translate(`dashboard.greeting.${period}`);
    const name = this.auth.user()?.name.split(' ')[0];
    return name ? this.i18n.translate('dashboard.greeting.withName', { greeting, name }) : greeting;
  });

  /** Whether a metric's trend moved in the desired direction. */
  protected isPositive(stat: StatMetric): boolean {
    return stat.trend >= 0 !== !!stat.lowerIsBetter;
  }
}
