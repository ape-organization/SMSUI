import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';
import { APP_ROUTES } from '../../../core/constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RequestState } from '../../../core/utils/request-state';
import { fieldError } from '../../../shared/forms/field-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly i18n = inject(I18nService);
  protected readonly request = new RequestState();
  protected readonly showPassword = signal(false);
  protected readonly fieldError = fieldError;

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.request.run(this.auth.login(this.form.getRawValue()), (challenge) =>
      this.router.navigateByUrl(
        challenge.requiresPasswordChange ? APP_ROUTES.changePassword : APP_ROUTES.verifyOtp,
      ),
    );
  }
}
