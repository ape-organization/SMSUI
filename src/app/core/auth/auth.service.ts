import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { I18nService } from '../i18n/i18n.service';
import {
  AuthChallenge,
  AuthSession,
  ChangePasswordRequest,
  LoginRequest,
  ResendOtpRequest,
  VerifyOtpRequest,
} from './auth.models';
import { SessionStore } from './session.store';

/** All authentication API calls; keeps SessionStore in sync with server responses. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(SessionStore);
  private readonly i18n = inject(I18nService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly user = this.store.user;
  readonly challenge = this.store.challenge;

  login(credentials: LoginRequest): Observable<AuthChallenge> {
    return this.http
      .post<AuthChallenge>(`${this.baseUrl}/login`, credentials)
      .pipe(tap((challenge) => this.store.setChallenge(challenge)));
  }

  changePassword(newPassword: string): Observable<AuthChallenge> {
    return this.withChallenge((challengeId) =>
      this.http
        .post<AuthChallenge>(`${this.baseUrl}/change-password`, {
          challengeId,
          newPassword,
        } satisfies ChangePasswordRequest)
        .pipe(tap((challenge) => this.store.setChallenge(challenge))),
    );
  }

  verifyOtp(code: string): Observable<AuthSession> {
    return this.withChallenge((challengeId) =>
      this.http
        .post<AuthSession>(`${this.baseUrl}/verify-otp`, {
          challengeId,
          code,
        } satisfies VerifyOtpRequest)
        .pipe(tap((session) => this.store.setSession(session))),
    );
  }

  resendOtp(): Observable<void> {
    return this.withChallenge((challengeId) =>
      this.http.post<void>(`${this.baseUrl}/resend-otp`, { challengeId } satisfies ResendOtpRequest),
    );
  }

  cancelChallenge(): void {
    this.store.setChallenge(null);
  }

  logout(): void {
    this.store.clear();
  }

  private withChallenge<T>(request: (challengeId: string) => Observable<T>): Observable<T> {
    const challenge = this.store.challenge();
    return challenge
      ? request(challenge.challengeId)
      : throwError(() => new Error(this.i18n.translate('errors.noSession')));
  }
}
