import { Router } from 'express';
import { getMentors } from '../controllers/mentorController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/', protect, getMentors);

export default router;
