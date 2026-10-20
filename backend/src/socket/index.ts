import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

let io: Server | null = null;

const isAllowedOrigin = (origin: string | undefined): boolean =>
  !origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === (process.env.CLIENT_URL || 'http://localhost:5173');

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
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToAll = (event: string, payload: unknown): void => {
  io?.emit(event, payload);
};
