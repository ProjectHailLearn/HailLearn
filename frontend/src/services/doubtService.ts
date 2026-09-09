import api from './api';
import { Doubt } from '../types';

export const doubtService = {
  getAll: async (): Promise<Doubt[]> => {
    const res = await api.get('/doubts');
    return res.data.data.map(toDoubt);
  },
  create: async (payload: {
    title: string; description: string; codeSnippet?: string;
    subject: string; courseCode: string; tags?: string[];
    aiSolution?: Doubt['aiSolution']; aiConfidenceScore?: number;
    authorName: string; authorAvatar: string; authorDepartment: string;
  }): Promise<Doubt> => {
    const res = await api.post('/doubts', payload);
    return toDoubt(res.data.data);
  },
  upvote: async (id: string): Promise<Doubt> => {
    const res = await api.put(`/doubts/${id}/upvote`);
    return toDoubt(res.data.data);
  },
  escalate: async (id: string, payload: { mentorId: string; mentorName: string; mentorAvatar: string; karma: number }): Promise<Doubt> => {
    const res = await api.put(`/doubts/${id}/escalate`, payload);
    return toDoubt(res.data.data);
  },
};

function toDoubt(d: Record<string, unknown>): Doubt {
  return {
    id: (d._id as string) || (d.id as string),
    title: d.title as string,
    description: d.description as string,
    codeSnippet: d.codeSnippet as string | undefined,
    subject: d.subject as string,
    courseCode: d.courseCode as string,
    tags: (d.tags as string[]) || [],
    status: d.status as Doubt['status'],
    author: d.author as Doubt['author'],
    aiConfidenceScore: d.aiConfidenceScore as number | undefined,
    aiSolution: d.aiSolution as Doubt['aiSolution'] | undefined,
    assignedMentor: d.assignedMentor as Doubt['assignedMentor'] | undefined,
    createdAt: d.createdAt
      ? new Date(d.createdAt as string).toLocaleDateString()
      : 'Just now',
    upvotes: (d.upvotes as number) || 0,
    views: (d.views as number) || 0,
  };
}
