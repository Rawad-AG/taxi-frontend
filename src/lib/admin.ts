import type { Ride } from '../types/ride';
import type { AdminUser, FinancialReport, Overview, PerformanceReport, SystemConfig } from '../types/admin';
import { api } from './api';

export const adminApi = {
  async overview(): Promise<Overview> {
    const { data } = await api.get<{ overview: Overview }>('/admin/overview');
    return data.overview;
  },

  async users(params: { role?: string; status?: string; q?: string } = {}): Promise<AdminUser[]> {
    const { data } = await api.get<{ users: AdminUser[] }>('/admin/users', { params });
    return data.users;
  },

  async driverDecision(userId: string, approve: boolean): Promise<AdminUser> {
    const { data } = await api.post<{ user: AdminUser }>(`/admin/users/${userId}/driver-decision`, { approve });
    return data.user;
  },

  async rides(params: { status?: string; q?: string; from?: string; to?: string } = {}): Promise<Ride[]> {
    const { data } = await api.get<{ rides: Ride[] }>('/admin/rides', { params });
    return data.rides;
  },

  async cancelRide(rideId: string, reason?: string): Promise<Ride> {
    const { data } = await api.post<{ ride: Ride }>(`/admin/rides/${rideId}/cancel`, { reason });
    return data.ride;
  },

  async financialReport(from?: string, to?: string): Promise<FinancialReport> {
    const { data } = await api.get<{ report: FinancialReport }>('/admin/reports/financial', { params: { from, to } });
    return data.report;
  },

  async performanceReport(from?: string, to?: string): Promise<PerformanceReport> {
    const { data } = await api.get<{ report: PerformanceReport }>('/admin/reports/performance', { params: { from, to } });
    return data.report;
  },

  async getConfig(): Promise<SystemConfig> {
    const { data } = await api.get<{ config: SystemConfig }>('/admin/config');
    return data.config;
  },

  async saveConfig(config: SystemConfig): Promise<{ config: SystemConfig; message: string }> {
    const { data } = await api.put<{ config: SystemConfig; message: string }>('/admin/config', config);
    return data;
  },

  async broadcast(input: { title: string; body: string; audience: 'all' | 'customers' | 'drivers' }): Promise<{ sent: number }> {
    const { data } = await api.post<{ sent: number }>('/admin/notifications', input);
    return data;
  },

  async broadcastHistory(): Promise<Array<{ title: string; body: string; sentAt: string; count: number }>> {
    const { data } = await api.get<{ broadcasts: Array<{ title: string; body: string; sentAt: string; count: number }> }>('/admin/notifications/history');
    return data.broadcasts;
  },
};
