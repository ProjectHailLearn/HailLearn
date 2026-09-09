import { Router } from 'express';
import { getKnowledgeItems } from '../controllers/knowledgeController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/', protect, getKnowledgeItems);

export default router;
