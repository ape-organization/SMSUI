import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { delay, mergeMap, Observable, of, throwError, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiToken,
  CreateApiTokenRequest,
  CreatedApiToken,
  UpdateApiTokenRequest,
} from '../../models/api-integration.models';
import { DashboardSummary } from '../../models/dashboard.models';
import {
  AuthChallenge,
  AuthSession,
  ChangePasswordRequest,
  LoginRequest,
  ResendOtpRequest,
  VerifyOtpRequest,
} from '../auth/auth.models';
import { Language } from '../i18n/i18n.types';
import { SaveUserRequest, SystemUser } from '../../models/users.models';

/*
 * In-memory fake backend for local development. Responds in the language sent via Accept-Language.
 *   Password : Password@123 (any username)
 *   OTP code : 123456
 *   Username "newuser" triggers the first-login change-password flow.
 */
export const MOCK_CREDENTIALS = {
  password: 'Password@123',
  otp: '123456',
  firstLoginUser: 'newuser',
} as const;

const LATENCY_MS = 600;

type Stage = 'password' | 'otp';
type Localized = Record<Language, string>;
/** `id` is the trailing path segment for routes registered as `.../:id`. */
type Handler = (
  req: HttpRequest<unknown>,
  lang: Language,
  id: string,
) => Observable<HttpEvent<unknown>>;

const MESSAGES = {
  invalidCredentials: {
    en: 'Invalid username or password.',
    ar: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
  },
  sessionExpired: {
    en: 'Your sign-in session has expired. Please sign in again.',
    ar: 'انتهت صلاحية جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.',
  },
  samePassword: {
    en: 'Your new password must be different from the temporary one.',
    ar: 'يجب أن تختلف كلمة المرور الجديدة عن كلمة المرور المؤقتة.',
  },
  invalidOtp: {
    en: 'Invalid verification code. Please try again.',
    ar: 'رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.',
  },
  unauthorized: { en: 'Unauthorized.', ar: 'غير مصرّح.' },
  notFound: { en: 'Endpoint not found.', ar: 'المسار غير موجود.' },
  emailTaken: {
    en: 'A user with this email already exists.',
    ar: 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل.',
  },
  userNotFound: { en: 'User not found.', ar: 'المستخدم غير موجود.' },
  tokenNotFound: { en: 'API token not found.', ar: 'رمز API غير موجود.' },
} satisfies Record<string, Localized>;

const challenges = new Map<string, { username: string; stage: Stage }>();
const changedPasswords = new Map<string, string>();

const ok = <T>(body: T) => of(new HttpResponse({ status: 200, body })).pipe(delay(LATENCY_MS));

const fail = (status: number, message: Localized, lang: Language) =>
  timer(LATENCY_MS).pipe(
    mergeMap(() =>
      throwError(() => new HttpErrorResponse({ status, error: { message: message[lang] } })),
    ),
  );

function maskDestination(username: string): string {
  const email = username.includes('@') ? username : `${username}@example.com`;
  const [local, domain] = email.split('@');
  return `${local[0]}${'•'.repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

function issueChallenge(username: string, stage: Stage): AuthChallenge {
  const challengeId = crypto.randomUUID();
  challenges.set(challengeId, { username, stage });
  return {
    challengeId,
    otpDestination: maskDestination(username),
    requiresPasswordChange: stage === 'password',
  };
}

function findChallenge(challengeId: string, stage: Stage) {
  const challenge = challenges.get(challengeId);
  return challenge?.stage === stage ? challenge : null;
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function dashboardSummary(lang: Language): DashboardSummary {
  const t = (text: Localized) => text[lang];
  return {
    stats: [
      {
        label: t({ en: 'Total users', ar: 'إجمالي المستخدمين' }),
        value: 2847,
        trend: 12.5,
        icon: 'group',
        tone: 'blue',
      },
      {
        label: t({ en: 'Messages sent', ar: 'الرسائل المُرسلة' }),
        value: 18392,
        trend: 8.2,
        icon: 'sms',
        tone: 'green',
      },
      {
        label: t({ en: 'Active sessions', ar: 'الجلسات النشطة' }),
        value: 342,
        trend: -3.1,
        icon: 'bar_chart',
        tone: 'navy',
      },
      {
        label: t({ en: 'Failed deliveries', ar: 'رسائل لم تُسلَّم' }),
        value: 27,
        trend: -14.6,
        icon: 'error',
        tone: 'red',
        lowerIsBetter: true,
      },
    ],
    activity: [
      {
        id: '1',
        title: t({ en: 'Campaign delivered', ar: 'تم تسليم الحملة' }),
        description: t({
          en: 'Monthly newsletter reached 1,204 recipients.',
          ar: 'وصلت النشرة الشهرية إلى 1,204 مستلمين.',
        }),
        timestamp: minutesAgo(8),
        status: 'success',
      },
      {
        id: '2',
        title: t({ en: 'New user registered', ar: 'تسجيل مستخدم جديد' }),
        description: t({
          en: 'Sarah Ahmed joined the Operations team.',
          ar: 'انضمت سارة أحمد إلى فريق العمليات.',
        }),
        timestamp: minutesAgo(42),
        status: 'info',
      },
      {
        id: '3',
        title: t({ en: 'Delivery failed', ar: 'فشل التسليم' }),
        description: t({
          en: '12 messages bounced due to invalid numbers.',
          ar: 'تعذّر تسليم 12 رسالة بسبب أرقام غير صحيحة.',
        }),
        timestamp: minutesAgo(95),
        status: 'error',
      },
      {
        id: '4',
        title: t({ en: 'Report generated', ar: 'تم إنشاء التقرير' }),
        description: t({
          en: 'Weekly usage report is ready to download.',
          ar: 'تقرير الاستخدام الأسبوعي جاهز للتنزيل.',
        }),
        timestamp: minutesAgo(180),
        status: 'success',
      },
      {
        id: '5',
        title: t({ en: 'Settings updated', ar: 'تم تحديث الإعدادات' }),
        description: t({
          en: 'Sender ID changed by an administrator.',
          ar: 'قام أحد المسؤولين بتغيير اسم المُرسل.',
        }),
        timestamp: minutesAgo(320),
        status: 'info',
      },
    ],
    security: {
      twoFactorEnabled: true,
      passwordUpdatedAt: minutesAgo(60 * 24 * 12),
      lastLoginAt: minutesAgo(0),
    },
  };
}

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

const users: SystemUser[] = [
  {
    id: 'u1',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@example.com',
    role: 'admin',
    status: 'active',
    createdAt: daysFromNow(-210),
  },
  {
    id: 'u2',
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@example.com',
    role: 'operator',
    status: 'active',
    createdAt: daysFromNow(-1),
  },
  {
    id: 'u3',
    name: 'Omar Khaled',
    email: 'omar.khaled@example.com',
    role: 'operator',
    status: 'inactive',
    createdAt: daysFromNow(-95),
  },
  {
    id: 'u4',
    name: 'Mona Youssef',
    email: 'mona.youssef@example.com',
    role: 'viewer',
    status: 'active',
    createdAt: daysFromNow(-40),
  },
];

const apiTokens: ApiToken[] = [
  { id: 't1', name: 'CRM integration', createdAt: daysFromNow(-60), expiresAt: daysFromNow(120) },
  { id: 't2', name: 'Billing service', createdAt: daysFromNow(-200), expiresAt: null },
  {
    id: 't3',
    name: 'Legacy campaign tool',
    createdAt: daysFromNow(-400),
    expiresAt: daysFromNow(-15),
  },
];

// Extra sample rows so both tables span more than one page.
const SAMPLE_USER_NAMES = [
  'Nour Ali',
  'Youssef Ibrahim',
  'Laila Mahmoud',
  'Karim Adel',
  'Hana Samir',
  'Tarek Fathy',
  'Dina Mostafa',
  'Ali Hamdy',
  'Salma Nabil',
  'Mostafa Reda',
  'Rana Ashraf',
  'Hossam Tamer',
  'Yasmin Sherif',
  'Amr Wael',
  'Nada Hesham',
  'Ziad Magdy',
  'Farida Osama',
  'Khaled Emad',
];
const SAMPLE_ROLES: SystemUser['role'][] = ['admin', 'operator', 'viewer'];

users.push(
  ...SAMPLE_USER_NAMES.map((name, i): SystemUser => ({
    id: `u${i + 5}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    role: SAMPLE_ROLES[i % SAMPLE_ROLES.length],
    status: i % 5 === 0 ? 'inactive' : 'active',
    createdAt: daysFromNow(-(i * 7 + 3)),
  })),
);

const SAMPLE_TOKEN_NAMES = [
  'Marketing automation',
  'Support desk',
  'Mobile app backend',
  'Data warehouse sync',
  'Order notifications',
  'HR portal',
  'Analytics export',
  'Partner gateway',
  'Staging tests',
];

apiTokens.push(
  ...SAMPLE_TOKEN_NAMES.map((name, i): ApiToken => ({
    id: `t${i + 4}`,
    name,
    createdAt: daysFromNow(-(i * 11 + 5)),
    expiresAt: i % 3 === 0 ? null : daysFromNow(i % 4 === 0 ? -(i + 2) : 30 + i * 15),
  })),
);

const emailTaken = (email: string, exceptId?: string) =>
  users.some((user) => user.id !== exceptId && user.email.toLowerCase() === email.toLowerCase());

function generateSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `sms_live_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** Rejects requests without a bearer token, like the real API. */
const authed =
  (handler: Handler): Handler =>
  (req, lang, id) =>
    req.headers.has('Authorization')
      ? handler(req, lang, id)
      : fail(401, MESSAGES.unauthorized, lang);

const routes: Record<string, Handler> = {
  'POST /auth/login': (req, lang) => {
    const { username, password } = req.body as LoginRequest;
    const key = username.trim().toLowerCase();
    if (password !== (changedPasswords.get(key) ?? MOCK_CREDENTIALS.password)) {
      return fail(401, MESSAGES.invalidCredentials, lang);
    }
    const firstLogin = key === MOCK_CREDENTIALS.firstLoginUser && !changedPasswords.has(key);
    return ok(issueChallenge(key, firstLogin ? 'password' : 'otp'));
  },

  'POST /auth/change-password': (req, lang) => {
    const { challengeId, newPassword } = req.body as ChangePasswordRequest;
    const challenge = findChallenge(challengeId, 'password');
    if (!challenge) return fail(401, MESSAGES.sessionExpired, lang);
    if (newPassword === MOCK_CREDENTIALS.password) return fail(400, MESSAGES.samePassword, lang);
    challenges.delete(challengeId);
    changedPasswords.set(challenge.username, newPassword);
    return ok(issueChallenge(challenge.username, 'otp'));
  },

  'POST /auth/verify-otp': (req, lang) => {
    const { challengeId, code } = req.body as VerifyOtpRequest;
    const challenge = findChallenge(challengeId, 'otp');
    if (!challenge) return fail(401, MESSAGES.sessionExpired, lang);
    if (code !== MOCK_CREDENTIALS.otp) return fail(400, MESSAGES.invalidOtp, lang);
    challenges.delete(challengeId);
    const name = challenge.username.split('@')[0];
    return ok<AuthSession>({
      accessToken: `mock.${crypto.randomUUID()}`,
      user: {
        id: crypto.randomUUID(),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: challenge.username.includes('@') ? challenge.username : `${name}@example.com`,
        role: lang === 'ar' ? 'مسؤول النظام' : 'Administrator',
      },
    });
  },

  'POST /auth/resend-otp': (req, lang) => {
    const { challengeId } = req.body as ResendOtpRequest;
    return findChallenge(challengeId, 'otp') ? ok(null) : fail(401, MESSAGES.sessionExpired, lang);
  },

  'GET /dashboard/summary': (req, lang) =>
    req.headers.has('Authorization')
      ? ok(dashboardSummary(lang))
      : fail(401, MESSAGES.unauthorized, lang),

  'GET /users': authed(() => ok(users)),

  'POST /users': authed((req, lang) => {
    const body = req.body as SaveUserRequest;
    if (emailTaken(body.email)) return fail(409, MESSAGES.emailTaken, lang);
    const user: SystemUser = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    users.unshift(user);
    return ok(user);
  }),

  'PUT /users/:id': authed((req, lang, id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) return fail(404, MESSAGES.userNotFound, lang);
    const body = req.body as SaveUserRequest;
    if (emailTaken(body.email, id)) return fail(409, MESSAGES.emailTaken, lang);
    users[index] = { ...users[index], ...body };
    return ok(users[index]);
  }),

  'DELETE /users/:id': authed((req, lang, id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) return fail(404, MESSAGES.userNotFound, lang);
    users.splice(index, 1);
    return ok(null);
  }),

  'GET /api-tokens': authed(() => ok(apiTokens)),

  'POST /api-tokens': authed((req) => {
    const { name, expiresAt } = req.body as CreateApiTokenRequest;
    const token: ApiToken = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    apiTokens.unshift(token);
    return ok<CreatedApiToken>({ token, secret: generateSecret() });
  }),

  'PATCH /api-tokens/:id': authed((req, lang, id) => {
    const token = apiTokens.find((item) => item.id === id);
    if (!token) return fail(404, MESSAGES.tokenNotFound, lang);
    token.name = (req.body as UpdateApiTokenRequest).name;
    return ok(token);
  }),

  'DELETE /api-tokens/:id': authed((req, lang, id) => {
    const index = apiTokens.findIndex((item) => item.id === id);
    if (index < 0) return fail(404, MESSAGES.tokenNotFound, lang);
    apiTokens.splice(index, 1);
    return ok(null);
  }),
};

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  const lang: Language = req.headers.get('Accept-Language')?.startsWith('ar') ? 'ar' : 'en';
  const path = req.url.slice(environment.apiUrl.length);
  const exact = routes[`${req.method} ${path}`];
  if (exact) return exact(req, lang, '');

  // Fall back to a `/:id` route, e.g. `PUT /users/:id`.
  const slash = path.lastIndexOf('/');
  const withId = routes[`${req.method} ${path.slice(0, slash)}/:id`];
  return withId ? withId(req, lang, path.slice(slash + 1)) : fail(404, MESSAGES.notFound, lang);
};
