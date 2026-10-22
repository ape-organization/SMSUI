import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { DeleteDialog } from '../../../shared/ui/delete-dialog/delete-dialog';
import { UserFormDialog } from '../user-form-dialog/user-form-dialog';
import { UsersService } from '../../../services/users.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import {
  SystemUser,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  UserRole,
  UserStatus,
} from '../../../models/users.models';
import { RequestState } from '../../../core/utils/request-state';
import { Paginator } from '../../../core/utils/paginator';



@Component({
  selector: 'app-users',
  imports: [DatePipe, TranslatePipe, MatIcon, Pagination, DeleteDialog, UserFormDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.html',
})
export class Users {
  private readonly usersApi = inject(UsersService);
  private readonly deleteDialog = viewChild.required(DeleteDialog);

  protected readonly locale = inject(I18nService).language;
  protected readonly roleLabels = USER_ROLE_LABELS;
  protected readonly statusLabels = USER_STATUS_LABELS;
  protected readonly roles = Object.keys(USER_ROLE_LABELS) as UserRole[];
  protected readonly statuses = Object.keys(USER_STATUS_LABELS) as UserStatus[];
  protected readonly placeholders = [1, 2, 3, 4];

  protected readonly listRequest = new RequestState();

  protected readonly users = signal<SystemUser[]>([]);

  // Search and filters run on the loaded list (the API returns every user; paging is client-side too).
  protected readonly query = signal('');
  protected readonly roleFilter = signal<UserRole | ''>('');
  protected readonly statusFilter = signal<UserStatus | ''>('');
  protected readonly hasFilters = computed(
    () => !!this.query().trim() || !!this.roleFilter() || !!this.statusFilter(),
  );

  protected readonly filteredUsers = computed(() => {
    const query = this.query().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();
    return this.users().filter(
      (user) =>
        (!query ||
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)) &&
        (!role || user.role === role) &&
        (!status || user.status === status),
    );
  });

  protected readonly paginator = new Paginator(this.filteredUsers);
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

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.paginator.goTo(1);
  }

  protected setRole(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as UserRole | '');
    this.paginator.goTo(1);
  }

  protected setStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as UserStatus | '');
    this.paginator.goTo(1);
  }

  protected clearFilters(): void {
    this.query.set('');
    this.roleFilter.set('');
    this.statusFilter.set('');
    this.paginator.goTo(1);
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
