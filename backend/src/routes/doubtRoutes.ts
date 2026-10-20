import { Router } from 'express';
import {
  getDoubts, getDoubt, createDoubt, upvoteDoubt, escalateDoubt, answerDoubt, verifyDoubt, closeDoubt,
} from '../controllers/doubtController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', protect, getDoubts);
router.post('/', protect, createDoubt);
router.get('/:id', protect, getDoubt);
router.put('/:id/upvote', protect, upvoteDoubt);
router.put('/:id/escalate', protect, escalateDoubt);
router.post('/:id/answer', protect, authorize('mentor', 'faculty', 'admin'), answerDoubt);
router.put('/:id/verify', protect, authorize('faculty', 'admin'), verifyDoubt);
router.put('/:id/close', protect, closeDoubt);

export default router;
