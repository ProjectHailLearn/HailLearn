import { Router } from 'express';
import { getMentors } from '../controllers/mentorController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', getMentors);

export default router;
