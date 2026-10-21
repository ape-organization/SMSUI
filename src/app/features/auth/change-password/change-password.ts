import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';
import { APP_ROUTES } from '../../../core/constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RequestState } from '../../../core/utils/request-state';
import { fieldError } from '../../../shared/forms/field-error';
import {
  matchFieldValidator,
  PASSWORD_RULES,
  passwordStrengthValidator,
} from '../../../shared/forms/password.validators';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password.html',
})
export class ChangePassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly i18n = inject(I18nService);
  protected readonly request = new RequestState();
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly fieldError = fieldError;

  protected readonly form = inject(NonNullableFormBuilder).group({
    newPassword: ['', [Validators.required, passwordStrengthValidator]],
    confirmPassword: ['', [Validators.required, matchFieldValidator('newPassword')]],
  });

  private readonly newPassword = toSignal(this.form.controls.newPassword.valueChanges, {
    initialValue: '',
  });

  /** Live password policy checklist. */
  protected readonly rules = computed(() =>
    PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(this.newPassword()) })),
  );

  constructor() {
    // Re-check the confirmation whenever the new password changes.
    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.request.run(this.auth.changePassword(this.form.controls.newPassword.value), () =>
      this.router.navigateByUrl(APP_ROUTES.verifyOtp),
    );
  }

  protected backToLogin(): void {
    this.auth.cancelChallenge();
    void this.router.navigateByUrl(APP_ROUTES.login);
  }
}
