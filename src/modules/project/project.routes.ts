import { Router } from 'express';
import * as projectController from './project.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { cacheMiddleware } from '../../middleware/cache';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  uuidSchema,
} from '../../utils/validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID param validation schemas
const idParamSchema = z.object({
  id: uuidSchema,
});

const memberIdParamSchema = z.object({
  id: uuidSchema,
  memberId: uuidSchema,
});

// Project routes
router.get(
  '/',
  cacheMiddleware({ ttl: 60, keyPrefix: 'projects:list' }),
  projectController.getProjects
);

router.get(
  '/:id',
  validateParams(idParamSchema),
  cacheMiddleware({ ttl: 120, keyPrefix: 'projects:detail' }),
  projectController.getProjectById
);

router.post(
  '/',
  validateBody(createProjectSchema),
  projectController.createProject
);

router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateProjectSchema),
  projectController.updateProject
);

router.delete(
  '/:id',
  validateParams(idParamSchema),
  projectController.deleteProject
);

// Project member routes
router.get(
  '/:id/members',
  validateParams(idParamSchema),
  cacheMiddleware({ ttl: 60, keyPrefix: 'projects:members' }),
  projectController.getProjectMembers
);

router.post(
  '/:id/members',
  validateParams(idParamSchema),
  validateBody(addProjectMemberSchema),
  projectController.addProjectMember
);

router.delete(
  '/:id/members/:memberId',
  validateParams(memberIdParamSchema),
  projectController.removeProjectMember
);

// Admin routes - must be admin role
router.get(
  '/admin/all',
  authorize('admin'),
  cacheMiddleware({ ttl: 30, keyPrefix: 'admin:projects:all' }),
  projectController.getAllProjectsAdmin
);

router.get(
  '/admin/:id',
  authorize('admin'),
  validateParams(idParamSchema),
  projectController.getProjectByIdAdmin
);

export default router;
