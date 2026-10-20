import api from './api';
import { StudyRoom } from '../types';

const toRoom = (r: Record<string, unknown>): StudyRoom => ({ ...(r as unknown as StudyRoom), id: String(r.id) });

export const roomService = {
  getAll: async (): Promise<StudyRoom[]> => {
    const res = await api.get('/rooms');
    return res.data.data.map(toRoom);
  },
  create: async (payload: { title: string; courseCode: string; scheduledAt: string; durationMins?: number; meetingLink?: string }): Promise<StudyRoom> => {
    const res = await api.post('/rooms', payload);
    return toRoom(res.data.data);
  },
  toggleJoin: async (id: string): Promise<StudyRoom> => {
    const res = await api.put(`/rooms/${id}/join`);
    return toRoom(res.data.data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },
};
