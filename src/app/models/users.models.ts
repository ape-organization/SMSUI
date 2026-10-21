import { TranslationKey } from "../core/i18n/i18n.types";
import { Tone } from "./dashboard.models";


export type UserRole = 'admin' | 'operator' | 'viewer';

export type UserStatus = 'active' | 'inactive';

/** A portal account as listed on the Users page (distinct from the signed-in session user). */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type SaveUserRequest = Pick<SystemUser, 'name' | 'email' | 'role' | 'status'>;

/** Shared by the users table and the add/edit dialog. */
export const USER_ROLE_LABELS: Record<UserRole, TranslationKey> = {
  admin: 'users.roles.admin',
  operator: 'users.roles.operator',
  viewer: 'users.roles.viewer',
};

export const USER_STATUS_LABELS: Record<UserStatus, { label: TranslationKey; tone: Tone }> = {
  active: { label: 'users.statuses.active', tone: 'green' },
  inactive: { label: 'users.statuses.inactive', tone: 'red' },
};
