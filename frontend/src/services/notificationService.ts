import api from './api';
import { Notification } from '../types';

const timeAgo = (iso: string): string => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data.data.map((n: Record<string, unknown>) => ({
      id: n._id as string,
      title: n.title as string,
      message: n.message as string,
      timestamp: timeAgo(n.createdAt as string),
      read: n.read as boolean,
      type: n.type as Notification['type'],
      link: n.link as string | undefined,
    }));
  },
  markRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
};
