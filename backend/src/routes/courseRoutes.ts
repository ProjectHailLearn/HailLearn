import { Router } from 'express';
import { getCourses, toggleEnrollment } from '../controllers/courseController.js';
import { updateCourse } from '../controllers/adminController.js';
import { validate, courseSchema } from '../validators/index.js';
import { protect, authorize, validateObjectId } from '../middlewares/auth.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getCourses);
router.put('/:id/enroll', toggleEnrollment);
// Faculty keep syllabus progress and lecture schedule current.
router.put('/:id', authorize('faculty', 'admin'), validate(courseSchema.partial()), updateCourse);

export default router;
