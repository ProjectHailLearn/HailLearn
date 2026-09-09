import { Router } from 'express';
import { getDoubts, createDoubt, upvoteDoubt, escalateDoubt } from '../controllers/doubtController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/', protect, getDoubts);
router.post('/', protect, createDoubt);
router.put('/:id/upvote', protect, upvoteDoubt);
router.put('/:id/escalate', protect, escalateDoubt);

export default router;
