import { Router } from 'express';
import * as notificationController from './notification.controller';
import { authenticate } from '../../middleware/auth';
import { validateParams } from '../../middleware/validate';
import { uuidSchema } from '../../utils/validation';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const idParamSchema = z.object({
  id: uuidSchema,
});

router.get('/', notificationController.getNotifications);

router.patch('/read-all', notificationController.markAllNotificationsAsRead);

router.patch(
  '/:id/read',
  validateParams(idParamSchema),
  notificationController.markNotificationAsRead
);

export default router;
