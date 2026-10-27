import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middlewares/auth.js';
import { markSeen, markOffline } from '../services/presenceService.js';

const router = Router();
router.use(protect);

// Heartbeat from an open app tab (sent every 30s); works without a socket connection.
router.post('/', async (req: AuthRequest, res: Response) => {
  await markSeen(req.userId!).catch(() => undefined);
  res.json({ success: true });
});

// Sent on logout so the user disappears immediately instead of after the online window.
router.delete('/', async (req: AuthRequest, res: Response) => {
  await markOffline(req.userId!).catch(() => undefined);
  res.json({ success: true });
});

export default router;
