import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { Mentor } from './models/Mentor.js';
import notificationRoutes from './routes/notificationRoutes.js';
import presenceRoutes from './routes/presenceRoutes.js';
import { onlineMentorFilter } from './services/presenceService.js';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import { getStats } from './controllers/statsController.js';
import { protect } from './middlewares/auth.js';

export const createApp = (): Express => {
  const app: Express = express();

  // Behind one proxy (Vercel/load balancer): use X-Forwarded-For so rate limits are per client, not per proxy.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow any localhost port in development
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        // Allow Vercel preview and production domains
        if (process.env.VERCEL || /^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
        const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
        if (origin === allowed) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  // Auto-connect to MongoDB if configured and not yet connected (supports serverless)
  app.use(async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      if (process.env.MONGODB_URI && mongoose.connection.readyState < 1) {
        await connectDB();
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // Writes keep the strict limit. Reads get their own, larger budget: without Socket.IO (e.g. on Vercel)
  // the client polls chat every 3s plus notifications/presence, about 30 GETs a minute per open tab.
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const tooMany = { success: false, message: 'Too many requests, please try again later.' };
  const writeLimiter = rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
    skip: (req) => req.method === 'GET',
    message: tooMany,
  });
  const readLimiter = rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_READS) || 1500,
    skip: (req) => req.method !== 'GET',
    message: tooMany,
  });
  app.use('/api', writeLimiter, readLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'HailLearn API is running smoothly',
      data: { timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/doubts', doubtRoutes);
  app.use('/api/mentors', mentorRoutes);
  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/admin', adminRoutes);
  app.get('/api/system', protect, async (_req: Request, res: Response) => {
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();
    const aiConfigured = !!process.env.AI_API_KEY && (provider === 'gemini' || provider === 'grok');
    const onlineMentors = await Mentor.countDocuments(onlineMentorFilter()).catch(() => 0);
    res.json({ success: true, data: { aiProvider: aiConfigured ? provider : 'fallback', aiConfigured, onlineMentors } });
  });
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/presence', presenceRoutes);
  app.get('/api/stats', protect, getStats);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Global Error]', err);
    res.status(500).json({
      success: false,
      message: 'An unexpected internal server error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_SERVER_ERROR',
    });
  });

  return app;
};

const app: Express = createApp();
export default app;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Object.assign(app, { default: app, createApp });
}

