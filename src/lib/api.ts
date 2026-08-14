import axios, { AxiosError } from 'axios';
import i18n from '../i18n';
import type { ApiErrorBody } from '../types';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const CODE_KEYS: Record<string, string> = {
  UNAUTHORIZED: 'err.unauthorized',
  INVALID_CREDENTIALS: 'err.invalidCredentials',
  INVALID_OTP: 'err.otpInvalid',
  PHONE_ALREADY_REGISTERED: 'err.phoneAlreadyRegistered',
  VALIDATION_ERROR: 'err.validation',
  FORBIDDEN: 'err.forbidden',
  NOT_FOUND: 'err.notFound',
  CONFLICT: 'err.conflict',
  INVALID_STATE: 'err.invalidState',
  TOO_MANY_REQUESTS: 'err.tooManyRequests',
  RATE_LIMITED: 'err.rateLimited',
};

const PHRASE_KEYS: { match: RegExp; key: string }[] = [
  { match: /insufficient bucket/i, key: 'err.insufficientBucket' },
  { match: /pay-later needs/i, key: 'err.payLaterNotEligible' },
  { match: /overdue/i, key: 'err.payLaterBlockedOverdue' },
  { match: /already has an active/i, key: 'err.activeRideExists' },
  { match: /no drivers/i, key: 'err.noDrivers' },
  { match: /otp/i, key: 'err.otpInvalid' },
];

export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined;
    const code = body?.error?.code;
    if (code && CODE_KEYS[code] && i18n.exists(CODE_KEYS[code])) {
      return i18n.t(CODE_KEYS[code]);
    }
    const raw = body?.error?.details?.[0]?.message ?? body?.error?.message;
    if (raw) {
      const hit = PHRASE_KEYS.find((p) => p.match.test(raw));
      if (hit && i18n.exists(hit.key)) return i18n.t(hit.key);
      return raw;
    }
    if (err.code === 'ERR_NETWORK') return i18n.t('err.network');
  }
  return i18n.t('err.generic');
}

type RetryConfig = { _retried?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (typeof error.config & RetryConfig) | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        const { data } = await axios.post<{ accessToken: string }>('/api/auth/refresh', null, {
          withCredentials: true,
        });
        setAccessToken(data.accessToken);
        return api(original);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(error);
  },
);
