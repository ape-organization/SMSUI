import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Observable } from 'rxjs';

import { TranslationKey, TranslationParams } from '../../../core/i18n/i18n.types';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RequestState } from '../../../core/utils/request-state';

export interface DeleteOptions<T = unknown> {
  title: TranslationKey;
  message: TranslationKey;
  messageParams?: TranslationParams;
  confirmLabel: TranslationKey;
  /** The delete request; it runs only when the user confirms. */
  action: Observable<T>;
  /** Called after the request succeeds, just before the dialog closes. */
  onSuccess: (result: T) => void;
}

/**
 * Shared delete confirmation. Place one `<app-delete-dialog />` in a page and call
 * `open({...})`; the dialog runs the request, shows loading / errors and closes on success.
 */
@Component({
  selector: 'app-delete-dialog',
  imports: [TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delete-dialog.html',
})
export class DeleteDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly request = new RequestState();
  protected readonly options = signal<DeleteOptions | null>(null);

  open<T>(options: DeleteOptions<T>): void {
    this.options.set(options as DeleteOptions);
    this.request.reset();
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected confirm(): void {
    const options = this.options();
    if (!options || this.request.loading()) return;
    this.request.run(options.action, (result) => {
      options.onSuccess(result);
      this.close();
    });
  }

  /** Closes the dialog when the click lands on its backdrop rather than its panel. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
}
