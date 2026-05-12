import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  passwordSchema,
} from '../../utils/validation';
import { z } from 'zod';

const router = Router();

// Change password schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  '/refresh-token',
  authRateLimiter,
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

router.post('/logout', authenticate, authController.logout);

router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
