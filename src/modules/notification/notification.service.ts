import { query } from '../../database';
import { NotFoundError } from '../../utils/errors';
import { emitToUser } from '../../realtime/socketEmitter';

export type NotificationType = 'message_received' | 'task_assigned' | 'project_member_added';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

class NotificationService {
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    const result = await query(
      `SELECT id, user_id, type, title, message, is_read, metadata, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(this.mapNotification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as total
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return parseInt(result.rows[0].total, 10);
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Notification not found');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, type, title, message, is_read, metadata, created_at`,
      [data.userId, data.type, data.title, data.message, data.metadata || {}]
    );

    const notification = this.mapNotification(result.rows[0]);

    emitToUser(data.userId, 'notification:new', notification);

    return notification;
  }

  private mapNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    };
  }
}

export const notificationService = new NotificationService();
