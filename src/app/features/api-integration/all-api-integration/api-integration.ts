import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { DeleteDialog } from '../../../shared/ui/delete-dialog/delete-dialog';
import { TokenFormDialog } from '../token-form-dialog/token-form-dialog';
import { ApiIntegrationService } from '../../../services/api-integration.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { RequestState } from '../../../core/utils/request-state';
import { ApiToken } from '../../../models/api-integration.models';
import { Paginator } from '../../../core/utils/paginator';



@Component({
  selector: 'app-api-integration',
  imports: [DatePipe, TranslatePipe, MatIcon, Pagination, DeleteDialog, TokenFormDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './api-integration.html',
  styleUrl: './api-integration.css',
})
export class ApiIntegration {
  private readonly tokensApi = inject(ApiIntegrationService);
  private readonly deleteDialog = viewChild.required(DeleteDialog);

  protected readonly locale = inject(I18nService).language;
  protected readonly placeholders = [1, 2, 3];

  protected readonly listRequest = new RequestState();

  protected readonly tokens = signal<ApiToken[]>([]);
  protected readonly paginator = new Paginator(this.tokens);
  protected readonly loaded = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.listRequest.run(this.tokensApi.list(), (tokens) => {
      this.tokens.set(tokens);
      this.loaded.set(true);
    });
  }

  protected isExpired(token: ApiToken): boolean {
    return !!token.expiresAt && new Date(token.expiresAt).getTime() <= Date.now();
  }

  /** Replaces a renamed token in place; a new one goes on top and the table jumps to page 1. */
  protected onSaved(saved: ApiToken): void {
    const isNew = !this.tokens().some((token) => token.id === saved.id);
    this.tokens.update((list) =>
      isNew ? [saved, ...list] : list.map((token) => (token.id === saved.id ? saved : token)),
    );
    if (isNew) this.paginator.goTo(1);
  }

  protected confirmDelete(token: ApiToken): void {
    this.deleteDialog().open({
      title: 'apiIntegration.deleteDialog.title',
      message: 'apiIntegration.deleteDialog.message',
      messageParams: { name: token.name },
      confirmLabel: 'apiIntegration.deleteDialog.confirm',
      action: this.tokensApi.remove(token.id),
      onSuccess: () => this.tokens.update((list) => list.filter((item) => item.id !== token.id)),
    });
  }
}
