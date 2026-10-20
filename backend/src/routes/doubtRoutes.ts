import { Router } from 'express';
import {
  getDoubts, getDoubt, createDoubt, upvoteDoubt, escalateDoubt, answerDoubt, verifyDoubt, closeDoubt,
} from '../controllers/doubtController.js';
import { protect, authorize, validateObjectId } from '../middlewares/auth.js';
import { validate, createDoubtSchema, answerSchema } from '../validators/index.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getDoubts);
router.post('/', validate(createDoubtSchema), createDoubt);
router.get('/:id', getDoubt);
router.put('/:id/upvote', upvoteDoubt);
router.put('/:id/escalate', escalateDoubt);
router.post('/:id/answer', authorize('mentor', 'faculty', 'admin'), validate(answerSchema), answerDoubt);
router.put('/:id/verify', authorize('faculty', 'admin'), verifyDoubt);
router.put('/:id/close', closeDoubt);

export default router;
