"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const database_1 = require("../../database");
const errors_1 = require("../../utils/errors");
const socketEmitter_1 = require("../../realtime/socketEmitter");
class NotificationService {
    async getUserNotifications(userId, limit = 20) {
        const result = await (0, database_1.query)(`SELECT id, user_id, type, title, message, is_read, metadata, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [userId, limit]);
        return result.rows.map(this.mapNotification);
    }
    async getUnreadCount(userId) {
        const result = await (0, database_1.query)(`SELECT COUNT(*) as total
       FROM notifications
       WHERE user_id = $1 AND is_read = false`, [userId]);
        return parseInt(result.rows[0].total, 10);
    }
    async markAsRead(notificationId, userId) {
        const result = await (0, database_1.query)(`UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`, [notificationId, userId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('Notification not found');
        }
    }
    async markAllAsRead(userId) {
        await (0, database_1.query)(`UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`, [userId]);
    }
    async createNotification(data) {
        const result = await (0, database_1.query)(`INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, type, title, message, is_read, metadata, created_at`, [data.userId, data.type, data.title, data.message, data.metadata || {}]);
        const notification = this.mapNotification(result.rows[0]);
        (0, socketEmitter_1.emitToUser)(data.userId, 'notification:new', notification);
        return notification;
    }
    mapNotification(row) {
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
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map