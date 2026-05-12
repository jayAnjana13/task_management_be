import { CreateMessageInput, UpdateMessageInput } from '../../utils/validation';
import { QueryParams } from '../../utils/pagination';
export interface Message {
    id: string;
    content: string;
    projectId: string;
    userId: string;
    recipientId?: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
    };
    recipient?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
    };
    replyToId?: string;
    replyTo?: Message;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface MessageListResult {
    messages: Message[];
    total: number;
}
declare class ChatService {
    private truncateMessage;
    private notifyProjectMessageRecipients;
    getMessages(projectId: string, userId: string, params: QueryParams, userRole?: 'admin' | 'user'): Promise<MessageListResult>;
    getDirectMessages(projectId: string, userId: string, memberId: string, params: QueryParams, userRole?: 'admin' | 'user'): Promise<MessageListResult>;
    getMessageById(messageId: string, userId: string): Promise<Message>;
    createMessage(projectId: string, userId: string, data: CreateMessageInput): Promise<Message>;
    createDirectMessage(projectId: string, senderId: string, recipientId: string, data: CreateMessageInput): Promise<Message>;
    updateMessage(messageId: string, userId: string, data: UpdateMessageInput): Promise<Message>;
    deleteMessage(messageId: string, userId: string): Promise<void>;
    getRecentMessages(projectId: string, userId: string, limit?: number): Promise<Message[]>;
    private mapMessage;
}
export declare const chatService: ChatService;
export {};
//# sourceMappingURL=chat.service.d.ts.map