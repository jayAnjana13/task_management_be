import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { successResponse } from '../../utils/response';
import { notificationService } from './notification.service';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const rawLimit = parseInt((req.query.limit as string) || '20', 10);
  const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

  const [notifications, unreadCount] = await Promise.all([
    notificationService.getUserNotifications(req.user!.id, limit),
    notificationService.getUnreadCount(req.user!.id),
  ]);

  successResponse(res, { notifications, unreadCount });
});

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.params.id, req.user!.id);

  successResponse(res, null, 'Notification marked as read');
});

export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);

  successResponse(res, null, 'All notifications marked as read');
});
