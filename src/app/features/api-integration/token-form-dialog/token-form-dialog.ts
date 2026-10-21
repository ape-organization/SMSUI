import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RequestState } from '../../../core/utils/request-state';
import { futureDateValidator, tomorrowDateInputValue } from '../../../shared/forms/date.validators';
import { fieldError } from '../../../shared/forms/field-error';
import { ApiToken } from '../../../models/api-integration.models';
import { ApiIntegrationService } from '../../../services/api-integration.service';

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Generate / rename token dialog. Call `open()` to generate, `open(token)` to rename.
 * After generating, it shows the one-time secret until the user dismisses it.
 */
@Component({
  selector: 'app-token-form-dialog',
  imports: [ReactiveFormsModule, TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './token-form-dialog.html',
  styleUrl: './token-form-dialog.css',
})
export class TokenFormDialog {
  private readonly tokensApi = inject(ApiIntegrationService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** Emits the generated or renamed token. */
  readonly saved = output<ApiToken>();

  protected readonly fieldError = fieldError;
  protected readonly minExpiry = signal(tomorrowDateInputValue());
  protected readonly saveRequest = new RequestState();

  /** The token being renamed; null while generating a new one. */
  protected readonly editing = signal<ApiToken | null>(null);
  /** Plain-text token shown once right after generation. */
  protected readonly secret = signal<string | null>(null);
  protected readonly copyState = signal<CopyState>('idle');

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    expiresAt: ['', futureDateValidator],
  });

  open(token?: ApiToken): void {
    this.editing.set(token ?? null);
    this.form.reset({ name: token?.name ?? '', expiresAt: '' });
    if (token) {
      // Expiry is fixed at generation — only the name is sent on update.
      this.form.controls.expiresAt.disable();
    } else {
      this.form.controls.expiresAt.enable();
      this.minExpiry.set(tomorrowDateInputValue());
    }
    this.saveRequest.reset();
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const token = this.editing();
    const name = this.form.controls.name.value.trim();

    if (token) {
      this.saveRequest.run(this.tokensApi.rename(token.id, { name }), (updated) => {
        this.saved.emit(updated);
        this.close();
      });
      return;
    }

    // A date-only expiry means "valid through the end of that day" in the user's time zone.
    const expiryDate = this.form.controls.expiresAt.value;
    const expiresAt = expiryDate ? new Date(`${expiryDate}T23:59:59`).toISOString() : null;

    this.saveRequest.run(this.tokensApi.create({ name, expiresAt }), (created) => {
      this.saved.emit(created.token);
      this.copyState.set('idle');
      this.secret.set(created.secret);
    });
  }

  protected async copySecret(input: HTMLInputElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.secret() ?? '');
      this.copyState.set('copied');
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — select the text for a manual copy.
      input.select();
      this.copyState.set('failed');
    }
  }

  /** Runs whenever the dialog closes; the secret must not survive past this point. */
  protected onClosed(): void {
    this.secret.set(null);
    this.copyState.set('idle');
  }

  /** Keep the dialog open while the one-time secret is on screen so it is not dismissed by accident. */
  protected onCancel(event: Event): void {
    if (this.secret()) event.preventDefault();
  }

  /** Closes the dialog on a backdrop click — unless the one-time secret is showing. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.secret()) this.close();
  }
}
