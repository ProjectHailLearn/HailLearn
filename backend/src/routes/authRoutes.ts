import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validate, registerSchema, loginSchema, updateProfileSchema } from '../validators/index.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/me', protect, validate(updateProfileSchema), updateMe);

export default router;
