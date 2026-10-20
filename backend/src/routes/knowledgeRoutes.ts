import { Router } from 'express';
import { getKnowledgeItems, getCategories, toggleUpvote, recordView } from '../controllers/knowledgeController.js';
import { protect, validateObjectId } from '../middlewares/auth.js';

const router = Router();
router.use(protect);
router.param('id', validateObjectId);

router.get('/', getKnowledgeItems);
router.get('/categories', getCategories);
router.put('/:id/upvote', toggleUpvote);
router.put('/:id/view', recordView);

export default router;
