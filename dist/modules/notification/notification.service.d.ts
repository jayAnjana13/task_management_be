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
declare class NotificationService {
    getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    createNotification(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        metadata?: Record<string, any>;
    }): Promise<Notification>;
    private mapNotification;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notification.service.d.ts.map