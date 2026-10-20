import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;
let socketToken: string | null = null;

// Socket server lives at the API origin (strip the /api path).
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

// Reuses the socket for the same token; a different token (account switch) gets a fresh connection.
export const connectSocket = (token: string): Socket => {
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socketToken = token;
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
  socketToken = null;
};
