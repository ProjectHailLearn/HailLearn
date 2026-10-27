import api from './api';
import { KnowledgeItem } from '../types';

export const knowledgeService = {
  getAll: async (params?: { search?: string; category?: string }): Promise<KnowledgeItem[]> => {
    const res = await api.get('/knowledge', { params });
    return res.data.data.map((k: Record<string, unknown>) => ({
      id: (k._id as string) || (k.id as string),
      title: k.title as string,
      category: k.category as string,
      courseCode: k.courseCode as string,
      author: k.author as string,
      verificationBadge: (k.verificationBadge as boolean) || false,
      upvotes: (k.upvotes as number) || 0,
      views: (k.views as number) || 0,
      lastUpdated: k.updatedAt
        ? new Date(k.updatedAt as string).toLocaleDateString()
        : 'Recently',
      tags: (k.tags as string[]) || [],
      snippet: k.snippet as string,
      content: k.content as string | undefined,
      doubtId: k.doubtId as string | undefined,
      similarityScore: k.similarityScore as number | undefined,
      hasUpvoted: (k.hasUpvoted as boolean) || false,
    }));
  },
  getCategories: async (): Promise<string[]> => {
    const res = await api.get('/knowledge/categories');
    return res.data.data;
  },
  toggleUpvote: async (id: string): Promise<{ upvotes: number; hasUpvoted: boolean }> => {
    const res = await api.put(`/knowledge/${id}/upvote`);
    return res.data.data;
  },
  recordView: async (id: string): Promise<{ views: number }> => {
    const res = await api.put(`/knowledge/${id}/view`);
    return res.data.data;
  },
};
