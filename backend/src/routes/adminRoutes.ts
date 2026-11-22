import { Router } from 'express';
import {
  listUsers, updateUserRole, listMentorProfiles, linkMentorProfile, createCourse, updateCourse, deleteCourse,
  suspendUser, unsuspendUser, setMentorBadge, listConversations, getTranscript, getAnalytics, reindexSearch,
} from '../controllers/adminController.js';
import { protect, authorize, validateObjectId } from '../middlewares/auth.js';
import { listFlags, resolveFlag } from '../controllers/moderationController.js';
import { validate, updateRoleSchema, linkMentorSchema, courseSchema, suspendSchema, badgeSchema, resolveFlagSchema } from '../validators/index.js';

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
router.post('/users/:id/suspend', validate(suspendSchema), suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.put('/mentors/:id/badge', validate(badgeSchema), setMentorBadge);
router.get('/flags', listFlags);
router.post('/flags/:id/resolve', validate(resolveFlagSchema), resolveFlag);
router.get('/conversations', listConversations);
router.get('/conversations/:id/messages', getTranscript);
router.get('/analytics', getAnalytics);
router.post('/search/reindex', reindexSearch);

export default router;
