import api from './api';
import { AdminUser, AdminMentorProfile, UserRole, SystemStatus, ContentFlag, Conversation, Analytics, ChatMessage } from '../types';
import { toMessage } from './requestService';

export const adminService = {
  listUsers: async (params?: { search?: string; role?: string }): Promise<AdminUser[]> => {
    const res = await api.get('/admin/users', { params });
    return res.data.data.map((u: Record<string, unknown>) => ({ ...u, id: String(u.id) }) as AdminUser);
  },
  updateRole: async (id: string, role: UserRole): Promise<void> => {
    await api.put(`/admin/users/${id}/role`, { role });
  },
  listMentorProfiles: async (): Promise<AdminMentorProfile[]> => {
    const res = await api.get('/admin/mentors');
    return res.data.data.map((m: Record<string, unknown>) => ({ ...m, id: String(m.id) }) as AdminMentorProfile);
  },
  linkMentor: async (mentorId: string, userId: string): Promise<void> => {
    await api.put(`/admin/mentors/${mentorId}/link`, { userId });
  },
  createCourse: async (payload: {
    code: string; title: string; subject: string; instructor: string; credits?: number; category?: string; nextLecture?: string;
  }): Promise<void> => {
    await api.post('/admin/courses', payload);
  },
  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/admin/courses/${id}`);
  },
  suspend: async (id: string, reason?: string): Promise<void> => {
    await api.post(`/admin/users/${id}/suspend`, { reason });
  },
  unsuspend: async (id: string): Promise<void> => {
    await api.post(`/admin/users/${id}/unsuspend`);
  },
  setBadge: async (mentorId: string, verified: boolean): Promise<void> => {
    await api.put(`/admin/mentors/${mentorId}/badge`, { verified });
  },
  listFlags: async (status: 'open' | 'dismissed' | 'removed' = 'open'): Promise<ContentFlag[]> => {
    const res = await api.get('/admin/flags', { params: { status } });
    return res.data.data;
  },
  resolveFlag: async (id: string, action: 'dismiss' | 'remove'): Promise<void> => {
    await api.post(`/admin/flags/${id}/resolve`, { action });
  },
  listConversations: async (): Promise<Conversation[]> => {
    const res = await api.get('/admin/conversations');
    return res.data.data;
  },
  transcript: async (requestId: string): Promise<ChatMessage[]> => {
    const res = await api.get(`/admin/conversations/${requestId}/messages`);
    return res.data.data.map(toMessage);
  },
  analytics: async (): Promise<Analytics> => {
    const res = await api.get('/admin/analytics');
    return res.data.data;
  },
  reindexSearch: async (): Promise<{ vault: number; mentors: number }> => {
    const res = await api.post('/admin/search/reindex');
    return res.data.data;
  },
};

export const systemService = {
  get: async (): Promise<SystemStatus> => {
    const res = await api.get('/system');
    return res.data.data;
  },
};
