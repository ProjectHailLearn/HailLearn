import api from './api';

// Heartbeats keep mentor presence accurate where Socket.IO isn't available (e.g. Vercel).
export const presenceService = {
  heartbeat: async (): Promise<void> => {
    await api.post('/presence');
  },
  // Takes the token explicitly: logout clears it from storage before the request interceptor would read it.
  goOffline: async (token: string): Promise<void> => {
    await api.delete('/presence', { headers: { Authorization: `Bearer ${token}` } });
  },
};
