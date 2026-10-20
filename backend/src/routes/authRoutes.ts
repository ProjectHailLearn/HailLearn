import { Router } from 'express';
import { register, login, getMe, updateMe, forgotPassword, resetPassword, changePassword } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import {
  validate, registerSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema,
} from '../validators/index.js';
import rateLimit from 'express-rate-limit';

// Tighter limit on endpoints that can be brute-forced or used to spam email.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many login attempts, try again later.' } });
const sensitiveLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many attempts, try again later.' } });

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/me', protect, validate(updateProfileSchema), updateMe);
router.post('/forgot-password', sensitiveLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', sensitiveLimiter, validate(resetPasswordSchema), resetPassword);
router.put('/password', protect, sensitiveLimiter, validate(changePasswordSchema), changePassword);

export default router;
