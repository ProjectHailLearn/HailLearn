import { Router } from 'express';
import { getCourses, toggleEnrollment } from '../controllers/courseController.js';
import { protect, validateObjectId } from '../middlewares/auth.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getCourses);
router.put('/:id/enroll', toggleEnrollment);

export default router;
