import api from './api';
import { User } from '../types';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload {
  name: string; email: string; password: string;
  role?: string; university?: string; department?: string; semester?: number;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await api.post('/auth/login', payload);
    return res.data.data;
  },
  register: async (payload: RegisterPayload) => {
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  },
  updateMe: async (payload: Partial<Pick<User, 'name' | 'department' | 'university' | 'semester' | 'avatar' | 'specializations' | 'preferences'>>): Promise<User> => {
    const res = await api.put('/auth/me', payload);
    return res.data.data.user;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
};
