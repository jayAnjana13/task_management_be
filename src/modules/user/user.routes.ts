import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { cacheMiddleware, clearResourceCache } from '../../middleware/cache';
import { updateUserSchema, updateUserRoleSchema, uuidSchema } from '../../utils/validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID param validation schema
const idParamSchema = z.object({
  id: uuidSchema,
});

// Get all users (admin and users can view)
router.get(
  '/',
  cacheMiddleware({ ttl: 60, keyPrefix: 'users:list' }),
  userController.getUsers
);

// Get user by ID
router.get(
  '/:id',
  validateParams(idParamSchema),
  cacheMiddleware({ ttl: 120, keyPrefix: 'users:detail' }),
  userController.getUserById
);

// Update user (user can update own, admin can update any)
router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateUserSchema),
  userController.updateUser
);

// Admin-only routes
router.patch(
  '/:id/role',
  authorize('admin'),
  validateParams(idParamSchema),
  validateBody(updateUserRoleSchema),
  userController.updateUserRole
);

router.post(
  '/:id/deactivate',
  authorize('admin'),
  validateParams(idParamSchema),
  userController.deactivateUser
);

router.post(
  '/:id/activate',
  authorize('admin'),
  validateParams(idParamSchema),
  userController.activateUser
);

router.delete(
  '/:id',
  authorize('admin'),
  validateParams(idParamSchema),
  userController.deleteUser
);

export default router;
