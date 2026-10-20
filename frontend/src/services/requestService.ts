import api from './api';
import { MentorRequest, ChatMessage } from '../types';

export const toMessage = (m: Record<string, unknown>): ChatMessage => ({
  id: m._id as string,
  requestId: m.requestId as string,
  senderId: m.senderId as string,
  senderName: m.senderName as string,
  content: m.content as string,
  createdAt: m.createdAt as string,
});

const toRequest = (r: Record<string, unknown>): MentorRequest => ({
  id: (r._id as string) || (r.id as string),
  studentId: r.studentId as string,
  studentName: r.studentName as string,
  studentAvatar: (r.studentAvatar as string) || '',
  mentorId: r.mentorId as string,
  mentorName: r.mentorName as string,
  topic: (r.topic as string) || '',
  message: r.message as string,
  status: r.status as MentorRequest['status'],
  createdAt: r.createdAt ? new Date(r.createdAt as string).toLocaleString() : 'Just now',
});

export const requestService = {
  getAll: async (): Promise<{ sent: MentorRequest[]; received: MentorRequest[] }> => {
    const res = await api.get('/requests');
    return { sent: res.data.data.sent.map(toRequest), received: res.data.data.received.map(toRequest) };
  },
  create: async (payload: { mentorId: string; topic?: string; message: string }): Promise<MentorRequest> => {
    const res = await api.post('/requests', payload);
    return toRequest(res.data.data);
  },
  getMessages: async (id: string): Promise<ChatMessage[]> => {
    const res = await api.get(`/requests/${id}/messages`);
    return res.data.data.map(toMessage);
  },
  sendMessage: async (id: string, content: string): Promise<ChatMessage> => {
    const res = await api.post(`/requests/${id}/messages`, { content });
    return toMessage(res.data.data);
  },
  respond: async (id: string, status: 'ACCEPTED' | 'DECLINED'): Promise<MentorRequest> => {
    const res = await api.put(`/requests/${id}`, { status });
    return toRequest(res.data.data);
  },
};
