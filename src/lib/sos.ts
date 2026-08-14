import type { SosIncident, SosReason } from '../types/sos';
import { api } from './api';

export const sosApi = {
  async create(input: {
    rideId?: string;
    reason: SosReason;
    note?: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
  }): Promise<{ incident: SosIncident; emergencyPhone: string }> {
    const { data } = await api.post<{ incident: SosIncident; emergencyPhone: string }>('/sos', input);
    return data;
  },

  async mine(): Promise<SosIncident[]> {
    const { data } = await api.get<{ incidents: SosIncident[] }>('/sos/mine');
    return data.incidents;
  },

  async adminList(status?: 'open' | 'resolved'): Promise<SosIncident[]> {
    const { data } = await api.get<{ incidents: SosIncident[] }>('/sos/admin', { params: status ? { status } : undefined });
    return data.incidents;
  },

  async resolve(id: string, note?: string): Promise<SosIncident> {
    const { data } = await api.post<{ incident: SosIncident }>(`/sos/admin/${id}/resolve`, { note });
    return data.incident;
  },
};
