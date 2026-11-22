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
  // Returns { email, needsVerification }: no session until the emailed code is confirmed.
  register: async (payload: RegisterPayload): Promise<{ email: string; needsVerification: boolean }> => {
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  },
  verifyEmail: async (email: string, code: string): Promise<{ token: string; refreshToken: string; user: User }> => {
    const res = await api.post('/auth/verify-email', { email, code });
    return res.data.data;
  },
  resendVerification: async (email: string): Promise<string> => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data.message;
  },
  logout: async (refreshToken: string | null): Promise<void> => {
    if (refreshToken) await api.post('/auth/logout', { refreshToken });
  },
  updateMe: async (payload: Partial<Pick<User, 'name' | 'department' | 'university' | 'semester' | 'avatar' | 'specializations' | 'preferences'>>): Promise<User> => {
    const res = await api.put('/auth/me', payload);
    return res.data.data.user;
  },
  forgotPassword: async (email: string): Promise<string> => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data.message;
  },
  resetPassword: async (token: string, password: string): Promise<{ token: string; refreshToken: string; user: User }> => {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data.data;
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/password', { currentPassword, newPassword });
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
};
