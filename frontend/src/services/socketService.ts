import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;
let socketToken: string | null = null;

// Socket server lives at the API origin (strip the /api path, or use window origin for relative path).
const SOCKET_URL = API_URL.startsWith('http')
  ? API_URL.replace(/\/api\/?$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : '');

// VITE_REALTIME=false (e.g. on Vercel, which can't host the Socket.IO server) keeps the socket
// unconnected, so listeners attach harmlessly and no /socket.io requests are made.
const REALTIME_ENABLED = import.meta.env.VITE_REALTIME !== 'false';

// Reuses the socket for the same token; a different token (account switch) gets a fresh connection.
export const connectSocket = (token: string): Socket => {
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socketToken = token;
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], autoConnect: REALTIME_ENABLED });
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
  socketToken = null;
};

// False on Vercel (VITE_REALTIME=false) or while the socket is down; callers then poll instead.
export const isSocketConnected = (): boolean => !!socket?.connected;
