import { Router } from 'express';
import { getMentors, getAvailability, updateAvailability, getMyMentorProfile } from '../controllers/mentorController.js';
import { protect, validateObjectId } from '../middlewares/auth.js';
import { validate, availabilitySchema } from '../validators/index.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getMentors);
router.get('/me', getMyMentorProfile);
router.get('/:id/availability', getAvailability);
router.patch('/:id/availability', validate(availabilitySchema), updateAvailability);

export default router;
