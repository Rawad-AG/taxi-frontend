import type { SavedPlace, User } from '../types';
import type { RidePoint } from '../types/ride';
import { api } from './api';

export interface OtpChallenge {
  requiresOtp: boolean;
  otpChannel: 'sms' | 'whatsapp';
  phone: string;
  expiresIn: number;
  devOtp?: string;
}

export const profileApi = {
  async update(input: { firstName?: string; lastName?: string; avatar?: string | null }): Promise<User> {
    const { data } = await api.put<{ user: User }>('/profile', input);
    return data.user;
  },

  async requestChangePhone(newPhone: string): Promise<OtpChallenge> {
    const { data } = await api.post<OtpChallenge>('/profile/change-phone', { newPhone });
    return data;
  },

  async verifyChangePhone(code: string): Promise<{ user: User; accessToken: string }> {
    const { data } = await api.post<{ user: User; accessToken: string }>('/profile/change-phone/verify', { code });
    return data;
  },

  async addPlace(input: { name: string; label?: string; lat: number; lng: number }): Promise<User> {
    const { data } = await api.post<{ user: User }>('/profile/places', input);
    return data.user;
  },

  async updatePlace(id: string, input: { name?: string; label?: string; lat?: number; lng?: number }): Promise<User> {
    const { data } = await api.put<{ user: User }>(`/profile/places/${id}`, input);
    return data.user;
  },

  async deletePlace(id: string): Promise<User> {
    const { data } = await api.delete<{ user: User }>(`/profile/places/${id}`);
    return data.user;
  },

  async addRoute(input: { name: string; pickup: RidePoint; dropoff: RidePoint }): Promise<User> {
    const { data } = await api.post<{ user: User }>('/profile/routes', input);
    return data.user;
  },

  async deleteRoute(id: string): Promise<User> {
    const { data } = await api.delete<{ user: User }>(`/profile/routes/${id}`);
    return data.user;
  },

  async requestTwoFactor(): Promise<OtpChallenge> {
    const { data } = await api.post<OtpChallenge>('/profile/two-factor/request');
    return data;
  },

  async confirmTwoFactor(enabled: boolean, code: string): Promise<User> {
    const { data } = await api.post<{ user: User }>('/profile/two-factor/confirm', { enabled, code });
    return data.user;
  },
};

export function isSavedPlace(value: SavedPlace | undefined): value is SavedPlace {
  return !!value;
}
