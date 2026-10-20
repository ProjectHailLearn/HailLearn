import api from './api';
import { DashboardStats } from '../types';

export const statsService = {
  get: async (): Promise<DashboardStats> => {
    const res = await api.get('/stats');
    return res.data.data;
  },
};
