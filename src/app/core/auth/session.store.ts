import { computed, Injectable, signal } from '@angular/core';

import { readJson, writeJson } from '../utils/storage';
import { AuthChallenge, AuthSession } from './auth.models';

const SESSION_KEY = 'sms.session';
const CHALLENGE_KEY = 'sms.challenge';

/** Holds authentication state as signals and persists it across reloads. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _session = signal(readJson<AuthSession>(localStorage, SESSION_KEY));
  private readonly _challenge = signal(readJson<AuthChallenge>(sessionStorage, CHALLENGE_KEY));

  readonly session = this._session.asReadonly();
  readonly challenge = this._challenge.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly token = computed(() => this._session()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);

  setChallenge(challenge: AuthChallenge | null): void {
    this._challenge.set(challenge);
    writeJson(sessionStorage, CHALLENGE_KEY, challenge);
  }

  setSession(session: AuthSession | null): void {
    this._session.set(session);
    writeJson(localStorage, SESSION_KEY, session);
    this.setChallenge(null);
  }

  clear(): void {
    this.setSession(null);
  }
}
