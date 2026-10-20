import { Router } from 'express';
import {
  listUsers, updateUserRole, listMentorProfiles, linkMentorProfile, createCourse, updateCourse, deleteCourse,
} from '../controllers/adminController.js';
import { protect, authorize, validateObjectId } from '../middlewares/auth.js';
import { validate, updateRoleSchema, linkMentorSchema, courseSchema } from '../validators/index.js';

const router = Router();
router.use(protect, authorize('admin'));
router.param('id', validateObjectId);

router.get('/users', listUsers);
router.put('/users/:id/role', validate(updateRoleSchema), updateUserRole);
router.get('/mentors', listMentorProfiles);
router.put('/mentors/:id/link', validate(linkMentorSchema), linkMentorProfile);
router.post('/courses', validate(courseSchema), createCourse);
router.put('/courses/:id', validate(courseSchema.partial()), updateCourse);
router.delete('/courses/:id', deleteCourse);

export default router;
