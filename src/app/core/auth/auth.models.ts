export interface LoginRequest {
  username: string;
  password: string;
}

/** Short-lived step-up token issued after login, consumed by change-password / OTP steps. */
export interface AuthChallenge {
  challengeId: string;
  otpDestination: string;
  requiresPasswordChange: boolean;
}

export interface ChangePasswordRequest {
  challengeId: string;
  newPassword: string;
}

export interface VerifyOtpRequest {
  challengeId: string;
  code: string;
}

export interface ResendOtpRequest {
  challengeId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}
