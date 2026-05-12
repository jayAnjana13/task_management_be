import { Router } from 'express';
import * as chatController from './chat.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { cacheMiddleware } from '../../middleware/cache';
import { createMessageSchema, updateMessageSchema, uuidSchema } from '../../utils/validation';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Param validation schemas
const projectIdParamSchema = z.object({
  projectId: uuidSchema,
});

const directMessageParamSchema = z.object({
  projectId: uuidSchema,
  memberId: uuidSchema,
});

const messageIdParamSchema = z.object({
  id: uuidSchema,
});

// Get messages for a project
router.get(
  '/projects/:projectId/messages',
  validateParams(projectIdParamSchema),
  cacheMiddleware({ ttl: 10, keyPrefix: 'chat:messages' }),
  chatController.getMessages
);

// Create message in a project
router.post(
  '/projects/:projectId/messages',
  validateParams(projectIdParamSchema),
  validateBody(createMessageSchema),
  chatController.createMessage
);

// Get direct messages between current user and a project member
router.get(
  '/projects/:projectId/direct/:memberId/messages',
  validateParams(directMessageParamSchema),
  chatController.getDirectMessages
);

// Send direct message to a project member
router.post(
  '/projects/:projectId/direct/:memberId/messages',
  validateParams(directMessageParamSchema),
  validateBody(createMessageSchema),
  chatController.createDirectMessage
);

// Get single message
router.get(
  '/messages/:id',
  validateParams(messageIdParamSchema),
  chatController.getMessageById
);

// Update message
router.patch(
  '/messages/:id',
  validateParams(messageIdParamSchema),
  validateBody(updateMessageSchema),
  chatController.updateMessage
);

// Delete message
router.delete(
  '/messages/:id',
  validateParams(messageIdParamSchema),
  chatController.deleteMessage
);

// Admin routes - view any project's chat
router.get(
  '/admin/projects/:projectId/messages',
  authorize('admin'),
  validateParams(projectIdParamSchema),
  cacheMiddleware({ ttl: 10, keyPrefix: 'admin:chat:messages' }),
  chatController.getMessagesAdmin
);

export default router;
