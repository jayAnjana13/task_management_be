"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const errorHandler_1 = require("../../middleware/errorHandler");
const response_1 = require("../../utils/response");
const notification_service_1 = require("./notification.service");
exports.getNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const rawLimit = parseInt(req.query.limit || '20', 10);
    const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
    const [notifications, unreadCount] = await Promise.all([
        notification_service_1.notificationService.getUserNotifications(req.user.id, limit),
        notification_service_1.notificationService.getUnreadCount(req.user.id),
    ]);
    (0, response_1.successResponse)(res, { notifications, unreadCount });
});
exports.markNotificationAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await notification_service_1.notificationService.markAsRead(req.params.id, req.user.id);
    (0, response_1.successResponse)(res, null, 'Notification marked as read');
});
exports.markAllNotificationsAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await notification_service_1.notificationService.markAllAsRead(req.user.id);
    (0, response_1.successResponse)(res, null, 'All notifications marked as read');
});
//# sourceMappingURL=notification.controller.js.map