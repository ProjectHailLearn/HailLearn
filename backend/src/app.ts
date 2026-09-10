import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';

export const createApp = (): Express => {
  const app: Express = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow any localhost port in development
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
        if (origin === allowed) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

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
