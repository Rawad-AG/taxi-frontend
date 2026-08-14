import type { AuthResponse, OtpVerifyResponse, User } from '../types';
import { api } from './api';

const USER_KEY = 'taxi.user';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export const authApi = {
  async login(phone: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { phone, password });
    return data;
  },

  async verifyOtp(phone: string, code: string): Promise<OtpVerifyResponse> {
    const { data } = await api.post<OtpVerifyResponse>('/auth/verify-otp', { phone, code });
    return data;
  },

  async registerCustomer(input: { firstName: string; lastName: string; phone: string; password: string }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register/customer', input);
    return data;
  },

  async registerDriver(input: {
    fullName: string;
    fatherName: string;
    phone: string;
    password: string;
    nationalId: string;
    licenseNumber: string;
    licenseExpiry: string;
    workingCity: string;
    workingAreas: string[];
    car: {
      make: string;
      model: string;
      year: number;
      color: string;
      plateNumber: string;
      seats: number;
      category: 'economy' | 'comfort' | 'luxury' | 'van';
    };
  }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register/driver', input);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async forgotPassword(phone: string): Promise<void> {
    await api.post('/auth/forgot-password', { phone });
  },

  async resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { phone, code, newPassword });
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },
};
