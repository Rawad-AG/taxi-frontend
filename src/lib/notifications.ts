import type { AppNotification } from '../types/notification';
import { api } from './api';

export const notificationApi = {
  async list(limit = 30, skip = 0, unreadOnly = false): Promise<{ notifications: AppNotification[]; total: number; unread: number }> {
    const { data } = await api.get<{ notifications: AppNotification[]; total: number; unread: number }>('/notifications', {
      params: { limit, skip, unread: unreadOnly ? 'true' : undefined },
    });
    return data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ unread: number }>('/notifications/unread-count');
    return data.unread;
  },

  async markRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};
