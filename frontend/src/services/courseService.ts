import api from './api';
import { Course } from '../types';

export const courseService = {
  getAll: async (): Promise<Course[]> => {
    const res = await api.get('/courses');
    return res.data.data.map((c: Record<string, unknown>) => ({ ...c, id: String(c.id) }) as Course);
  },
  toggleEnroll: async (id: string): Promise<boolean> => {
    const res = await api.put(`/courses/${id}/enroll`);
    return res.data.data.isEnrolled;
  },
};
