import { Router } from 'express';
import { createRequest, getRequests, respondToRequest, getMessages, sendMessage } from '../controllers/requestController.js';
import { protect, validateObjectId } from '../middlewares/auth.js';
import { validate, messageSchema } from '../validators/index.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getRequests);
router.post('/', createRequest);
router.put('/:id', respondToRequest);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', validate(messageSchema), sendMessage);

export default router;
