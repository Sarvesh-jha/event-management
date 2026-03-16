export interface UserNotification {
  id: string;
  type: string;
  channel: 'in-app' | 'email';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  isRead: boolean;
  sentAt?: string | null;
  createdAt?: string;
  event?: {
    id: string;
    title: string;
  } | null;
}
