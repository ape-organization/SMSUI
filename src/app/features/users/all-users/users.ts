import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { DeleteDialog } from '../../../shared/ui/delete-dialog/delete-dialog';
import { UserFormDialog } from '../user-form-dialog/user-form-dialog';
import { UsersService } from '../../../services/users.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { SystemUser, USER_ROLE_LABELS, USER_STATUS_LABELS } from '../../../models/users.models';
import { RequestState } from '../../../core/utils/request-state';
import { Paginator } from '../../../core/utils/paginator';



@Component({
  selector: 'app-users',
  imports: [DatePipe, TranslatePipe, MatIcon, Pagination, DeleteDialog, UserFormDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  private readonly usersApi = inject(UsersService);
  private readonly deleteDialog = viewChild.required(DeleteDialog);

  protected readonly locale = inject(I18nService).language;
  protected readonly roleLabels = USER_ROLE_LABELS;
  protected readonly statusLabels = USER_STATUS_LABELS;
  protected readonly placeholders = [1, 2, 3, 4];

  protected readonly listRequest = new RequestState();

  protected readonly users = signal<SystemUser[]>([]);
  protected readonly paginator = new Paginator(this.users);
  protected readonly loaded = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.listRequest.run(this.usersApi.list(), (users) => {
      this.users.set(users);
      this.loaded.set(true);
    });
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /** Replaces an edited user in place; a new one goes on top and the table jumps to page 1. */
  protected onSaved(saved: SystemUser): void {
    const isNew = !this.users().some((user) => user.id === saved.id);
    this.users.update((list) =>
      isNew ? [saved, ...list] : list.map((user) => (user.id === saved.id ? saved : user)),
    );
    if (isNew) this.paginator.goTo(1);
  }

  protected confirmDelete(user: SystemUser): void {
    this.deleteDialog().open({
      title: 'users.deleteDialog.title',
      message: 'users.deleteDialog.message',
      messageParams: { name: user.name },
      confirmLabel: 'users.deleteDialog.confirm',
      action: this.usersApi.remove(user.id),
      onSuccess: () => this.users.update((list) => list.filter((item) => item.id !== user.id)),
    });
  }
}
