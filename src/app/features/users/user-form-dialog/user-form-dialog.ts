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
import { fieldError } from '../../../shared/forms/field-error';
import { UsersService } from '../../../services/users.service';
import { SystemUser, USER_ROLE_LABELS, USER_STATUS_LABELS, UserRole, UserStatus } from '../../../models/users.models';


/** Add / edit user dialog. Call `open()` to add, `open(user)` to edit. */
@Component({
  selector: 'app-user-form-dialog',
  imports: [ReactiveFormsModule, TranslatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form-dialog.html',
})
export class UserFormDialog {
  private readonly usersApi = inject(UsersService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** Emits the created or updated user. */
  readonly saved = output<SystemUser>();

  protected readonly roleLabels = USER_ROLE_LABELS;
  protected readonly statusLabels = USER_STATUS_LABELS;
  protected readonly roles = Object.keys(USER_ROLE_LABELS) as UserRole[];
  protected readonly statuses = Object.keys(USER_STATUS_LABELS) as UserStatus[];
  protected readonly fieldError = fieldError;

  protected readonly saveRequest = new RequestState();
  /** The user being edited; null while adding a new one. */
  protected readonly editing = signal<SystemUser | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['viewer' as UserRole, Validators.required],
    status: ['active' as UserStatus, Validators.required],
  });

  open(user?: SystemUser): void {
    this.editing.set(user ?? null);
    this.form.reset(
      user
        ? { name: user.name, email: user.email, role: user.role, status: user.status }
        : undefined,
    );
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
    const user = this.editing();
    const body = this.form.getRawValue();
    const request = user ? this.usersApi.update(user.id, body) : this.usersApi.create(body);

    this.saveRequest.run(request, (saved) => {
      this.saved.emit(saved);
      this.close();
    });
  }

  /** Closes the dialog when the click lands on its backdrop rather than its panel. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
}
