import { Router } from 'express';
import { createRequest, getRequests, respondToRequest } from '../controllers/requestController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/', protect, getRequests);
router.post('/', protect, createRequest);
router.put('/:id', protect, respondToRequest);

export default router;
