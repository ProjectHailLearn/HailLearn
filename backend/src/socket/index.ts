import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { Mentor } from '../models/Mentor.js';

let io: Server | null = null;
// Open socket count per user, so presence survives multiple tabs.
const connections = new Map<string, number>();

const isAllowedOrigin = (origin: string | undefined): boolean =>
  !origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === (process.env.CLIENT_URL || 'http://localhost:5173');

const setPresence = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    const mentor = await Mentor.findOneAndUpdate({ userId }, { isOnline }, { new: true });
    if (mentor) io?.emit('mentors:presence', { mentorId: mentor._id.toString(), isOnline });
  } catch (err) {
    console.error('[socket] presence update failed:', (err as Error).message);
  }
};

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
      credentials: true,
    },
  });

  // Each authenticated socket joins a private room named after its user id.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    const count = (connections.get(userId) || 0) + 1;
    connections.set(userId, count);
    if (count === 1) void setPresence(userId, true);

    socket.on('disconnect', () => {
      const left = (connections.get(userId) || 1) - 1;
      if (left <= 0) {
        connections.delete(userId);
        void setPresence(userId, false);
      } else {
        connections.set(userId, left);
      }
    });
  });

  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToAll = (event: string, payload: unknown): void => {
  io?.emit(event, payload);
};
