import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';
import { APP_ROUTES, OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '../../../core/constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RequestState } from '../../../core/utils/request-state';

@Component({
  selector: 'app-verify-otp',
  imports: [TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verify-otp.html',
})
export class VerifyOtp {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  private resendTimer?: ReturnType<typeof setInterval>;

  protected readonly i18n = inject(I18nService);
  protected readonly otpLength = OTP_LENGTH;
  protected readonly verifyRequest = new RequestState();
  protected readonly resendRequest = new RequestState();
  protected readonly resent = signal(false);
  protected readonly resendIn = signal(0);

  protected readonly digits = signal<string[]>(this.emptyDigits());
  protected readonly code = computed(() => this.digits().join(''));
  protected readonly isComplete = computed(() => this.code().length === OTP_LENGTH);

  protected readonly error = computed(
    () => this.verifyRequest.error() ?? this.resendRequest.error(),
  );

  protected readonly destination = computed(() => {
    const destination = this.auth.challenge()?.otpDestination;
    // Isolate the address as LTR so it isn't scrambled inside Arabic text.
    return destination ? `⁦${destination}⁩` : this.i18n.translate('otp.fallbackDestination');
  });

  constructor() {
    afterNextRender(() => this.focusBox(0));
    this.startResendCountdown();
    inject(DestroyRef).onDestroy(() => clearInterval(this.resendTimer));
  }

  protected verify(): void {
    if (!this.isComplete() || this.verifyRequest.loading()) return;
    this.resent.set(false);
    this.verifyRequest.run(
      this.auth.verifyOtp(this.code()),
      () => this.router.navigateByUrl(APP_ROUTES.dashboard),
      () => {
        this.digits.set(this.emptyDigits());
        this.focusBox(0);
      },
    );
  }

  protected resend(): void {
    this.resent.set(false);
    this.resendRequest.run(this.auth.resendOtp(), () => this.resent.set(true));
    this.startResendCountdown();
  }

  protected backToLogin(): void {
    this.auth.cancelChallenge();
    void this.router.navigateByUrl(APP_ROUTES.login);
  }

  // ----- OTP boxes: auto-advance, backspace, arrows, paste -----

  protected onInput(index: number, event: Event): void {
    const box = event.target as HTMLInputElement;
    const typed = box.value.replace(/\D/g, '');
    // Two chars means a digit was typed over an existing one; longer input comes from autofill.
    this.fillFrom(index, typed.length === 2 ? typed.slice(-1) : typed);
    box.value = this.digits()[index];
  }

  protected onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      event.preventDefault();
      this.digits.update((digits) => digits.map((d, i) => (i === index - 1 ? '' : d)));
      this.focusBox(index - 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focusBox(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusBox(index + 1);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    this.fillFrom(0, event.clipboardData?.getData('text').replace(/\D/g, '') ?? '');
  }

  protected selectBox(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  private fillFrom(start: number, value: string): void {
    const next = [...this.digits()];
    let index = start;
    if (!value) {
      next[start] = '';
    }
    for (const char of value) {
      if (index >= next.length) break;
      next[index++] = char;
    }
    this.digits.set(next);
    if (value) this.focusBox(Math.min(index, next.length - 1));
    if (this.isComplete()) this.verify();
  }

  private focusBox(index: number): void {
    this.boxes()[index]?.nativeElement.focus();
  }

  private emptyDigits(): string[] {
    return Array.from({ length: OTP_LENGTH }, () => '');
  }

  private startResendCountdown(): void {
    clearInterval(this.resendTimer);
    this.resendIn.set(OTP_RESEND_COOLDOWN_SECONDS);
    this.resendTimer = setInterval(() => {
      this.resendIn.update((seconds) => seconds - 1);
      if (this.resendIn() <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }
}
