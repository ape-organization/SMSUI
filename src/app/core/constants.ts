export const APP_ROUTES = {
  login: '/auth/login',
  changePassword: '/auth/change-password',
  verifyOtp: '/auth/verify-otp',
  dashboard: '/dashboard',
  users: '/users',
  apiIntegration: '/api-integration',
} as const;

export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
