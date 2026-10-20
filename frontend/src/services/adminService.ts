import api from './api';
import { AdminUser, AdminMentorProfile, UserRole, SystemStatus } from '../types';

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
};

export const systemService = {
  get: async (): Promise<SystemStatus> => {
    const res = await api.get('/system');
    return res.data.data;
  },
};
