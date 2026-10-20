import { Router } from 'express';
import { createRequest, getRequests, respondToRequest } from '../controllers/requestController.js';
import { protect, validateObjectId } from '../middlewares/auth.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getRequests);
router.post('/', createRequest);
router.put('/:id', respondToRequest);

export default router;
