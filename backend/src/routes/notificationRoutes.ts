import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect, validateObjectId } from '../middlewares/auth.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;
