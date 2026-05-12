import { Router } from 'express';
import * as taskController from './task.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { cacheMiddleware } from '../../middleware/cache';
import { createTaskSchema, updateTaskSchema, uuidSchema } from '../../utils/validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID param validation schemas
const idParamSchema = z.object({
  id: uuidSchema,
});

const projectIdParamSchema = z.object({
  projectId: uuidSchema,
});

// Update positions schema
const updatePositionsSchema = z.object({
  updates: z.array(z.object({
    id: uuidSchema,
    position: z.number().int().min(0),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  })).min(1),
});

// Task routes
router.get(
  '/',
  cacheMiddleware({ ttl: 30, keyPrefix: 'tasks:list' }),
  taskController.getTasks
);

router.get(
  '/stats/:projectId',
  validateParams(projectIdParamSchema),
  cacheMiddleware({ ttl: 60, keyPrefix: 'tasks:stats' }),
  taskController.getTaskStats
);

router.get(
  '/:id',
  validateParams(idParamSchema),
  cacheMiddleware({ ttl: 60, keyPrefix: 'tasks:detail' }),
  taskController.getTaskById
);

router.post(
  '/',
  validateBody(createTaskSchema),
  taskController.createTask
);

router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateTaskSchema),
  taskController.updateTask
);

router.delete(
  '/:id',
  validateParams(idParamSchema),
  taskController.deleteTask
);

router.patch(
  '/positions/update',
  validateBody(updatePositionsSchema),
  taskController.updateTaskPositions
);

export default router;
