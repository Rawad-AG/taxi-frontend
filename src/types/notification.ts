export type NotificationType = 'ride' | 'sos' | 'payment' | 'account' | 'admin' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}
