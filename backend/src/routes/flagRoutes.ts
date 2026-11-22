import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { createFlag } from '../controllers/moderationController.js';
import { validate, flagSchema } from '../validators/index.js';

const router = Router();
router.use(protect);
router.post('/', validate(flagSchema), createFlag);

export default router;
