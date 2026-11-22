import api from './api';

export type FlagTarget = 'doubt' | 'answer' | 'message' | 'knowledge';

export const flagService = {
  // Report content to administrators. parentId: the doubt for an answer.
  report: async (targetType: FlagTarget, targetId: string, reason: string, parentId?: string): Promise<string> => {
    const res = await api.post('/flags', { targetType, targetId, reason, parentId });
    return res.data.message;
  },
};
