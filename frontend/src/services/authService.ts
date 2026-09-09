import api from './api';

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
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
};
