import api from './api';
import { Mentor } from '../types';

export const mentorService = {
  getAll: async (): Promise<Mentor[]> => {
    const res = await api.get('/mentors');
    return res.data.data.map((m: Record<string, unknown>) => ({
      id: (m._id as string) || (m.id as string),
      name: m.name as string,
      avatar: (m.avatar as string) || '',
      department: m.department as string,
      year: m.year as string,
      rating: (m.rating as number) || 4.5,
      reviewsCount: (m.reviewsCount as number) || 0,
      resolvedDoubtsCount: (m.resolvedDoubtsCount as number) || 0,
      karmaPoints: (m.karmaPoints as number) || 0,
      isOnline: (m.isOnline as boolean) || false,
      specializations: (m.specializations as string[]) || [],
      bio: (m.bio as string) || '',
    }));
  },
};
