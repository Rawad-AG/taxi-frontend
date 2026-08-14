import { api } from './api';

export interface Presence {
  online: boolean;
  city: string | null;
  areas: string[];
}

export const driverApi = {
  async getPresence(): Promise<Presence> {
    const { data } = await api.get<{ presence: Presence }>('/driver/presence');
    return data.presence;
  },

  async setPresence(online: boolean): Promise<Presence> {
    const { data } = await api.post<{ presence: Presence }>('/driver/presence', { online });
    return data.presence;
  },
};
