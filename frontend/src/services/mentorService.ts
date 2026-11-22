import api from './api';
import { Mentor, Availability } from '../types';

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
      hasAccount: (m.hasAccount as boolean) || false,
      userId: m.userId as string | undefined,
      reputationScore: (m.reputationScore as number) ?? 4,
      ratingsCount: (m.ratingsCount as number) || 0,
      avgResponseMinutes: m.avgResponseMinutes as number | undefined,
      verifiedBadge: (m.verifiedBadge as boolean) || false,
      availableNow: (m.availableNow as boolean) || false,
      availability: m.availability as Availability | undefined,
    }));
  },
  getMine: async (): Promise<{ id: string; availability: Availability; availableNow: boolean } | null> => {
    try {
      const res = await api.get('/mentors/me');
      return { id: res.data.data._id, availability: res.data.data.availability, availableNow: res.data.data.availableNow };
    } catch {
      return null; // not a mentor
    }
  },
  updateAvailability: async (mentorId: string, availability: Availability): Promise<Availability> => {
    const res = await api.patch(`/mentors/${mentorId}/availability`, availability);
    return res.data.data;
  },
};
