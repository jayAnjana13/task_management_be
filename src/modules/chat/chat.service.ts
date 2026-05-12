import { query } from '../../database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreateMessageInput, UpdateMessageInput } from '../../utils/validation';
import { QueryParams } from '../../utils/pagination';
import { projectService } from '../project/project.service';
import { notificationService } from '../notification';

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

class ChatService {
  private truncateMessage(content: string): string {
    if (content.length <= 120) {
      return content;
    }

    return `${content.slice(0, 117)}...`;
  }

  private async notifyProjectMessageRecipients(projectId: string, senderId: string, content: string): Promise<void> {
    const [projectResult, senderResult, recipientsResult] = await Promise.all([
      query('SELECT name FROM projects WHERE id = $1', [projectId]),
      query('SELECT first_name, last_name FROM users WHERE id = $1', [senderId]),
      query(
        `SELECT user_id
         FROM project_members
         WHERE project_id = $1 AND user_id <> $2`,
        [projectId, senderId]
      ),
    ]);

    const projectName = projectResult.rows[0]?.name || 'a project';
    const senderName = senderResult.rows[0]
      ? `${senderResult.rows[0].first_name} ${senderResult.rows[0].last_name}`.trim()
      : 'A team member';
    const excerpt = this.truncateMessage(content);

    await Promise.all(
      recipientsResult.rows.map((row: { user_id: string }) =>
        notificationService.createNotification({
          userId: row.user_id,
          type: 'message_received',
          title: 'New project message',
          message: `${senderName} sent a message in ${projectName}: "${excerpt}"`,
          metadata: { projectId },
        })
      )
    );
  }

  // Get messages for a project with pagination
  async getMessages(
    projectId: string,
    userId: string,
    params: QueryParams,
    userRole?: 'admin' | 'user'
  ): Promise<MessageListResult> {
    const { page, limit, offset } = params;

    // Check project access (admin always has access)
    const hasAccess = await projectService.userHasAccess(projectId, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this project');
    }

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM messages WHERE project_id = $1 AND recipient_id IS NULL',
      [projectId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get messages (ordered by newest first for pagination, will be reversed on client)
    const result = await query(
      `SELECT m.id, m.content, m.project_id, m.user_id, m.reply_to_id, 
          m.recipient_id,
              m.is_edited, m.created_at, m.updated_at,
              u.id as user_id, u.first_name, u.last_name, u.email, u.avatar_url,
          r.id as recipient_user_id, r.first_name as recipient_first_name,
          r.last_name as recipient_last_name, r.email as recipient_email,
          r.avatar_url as recipient_avatar_url,
              rm.id as reply_id, rm.content as reply_content, rm.user_id as reply_user_id,
              ru.first_name as reply_first_name, ru.last_name as reply_last_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
        LEFT JOIN users r ON m.recipient_id = r.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.user_id = ru.id
        WHERE m.project_id = $1 AND m.recipient_id IS NULL
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [projectId, limit, offset]
    );

    const messages = result.rows.map(this.mapMessage);

    return { messages, total };
  }

  // Get direct messages between two project members
  async getDirectMessages(
    projectId: string,
    userId: string,
    memberId: string,
    params: QueryParams,
    userRole?: 'admin' | 'user'
  ): Promise<MessageListResult> {
    const { limit, offset } = params;

    if (userId === memberId) {
      throw new ForbiddenError('You cannot create a direct chat with yourself');
    }

    const hasAccess = await projectService.userHasAccess(projectId, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this project');
    }

    const memberHasAccess = await projectService.userHasAccess(projectId, memberId, userRole);
    if (!memberHasAccess) {
      throw new NotFoundError('Project member not found');
    }

    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM messages
       WHERE project_id = $1
         AND ((user_id = $2 AND recipient_id = $3) OR (user_id = $3 AND recipient_id = $2))`,
      [projectId, userId, memberId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const result = await query(
      `SELECT m.id, m.content, m.project_id, m.user_id, m.reply_to_id,
              m.recipient_id, m.is_edited, m.created_at, m.updated_at,
              u.id as user_id, u.first_name, u.last_name, u.email, u.avatar_url,
              r.id as recipient_user_id, r.first_name as recipient_first_name,
              r.last_name as recipient_last_name, r.email as recipient_email,
              r.avatar_url as recipient_avatar_url,
              rm.id as reply_id, rm.content as reply_content, rm.user_id as reply_user_id,
              ru.first_name as reply_first_name, ru.last_name as reply_last_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN users r ON m.recipient_id = r.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.user_id = ru.id
       WHERE m.project_id = $1
         AND ((m.user_id = $2 AND m.recipient_id = $3) OR (m.user_id = $3 AND m.recipient_id = $2))
       ORDER BY m.created_at DESC
       LIMIT $4 OFFSET $5`,
      [projectId, userId, memberId, limit, offset]
    );

    return { messages: result.rows.map(this.mapMessage).reverse(), total };
  }

  // Get single message by ID
  async getMessageById(messageId: string, userId: string): Promise<Message> {
    const result = await query(
      `SELECT m.id, m.content, m.project_id, m.user_id, m.reply_to_id, 
              m.recipient_id,
              m.is_edited, m.created_at, m.updated_at,
              u.id as user_id, u.first_name, u.last_name, u.email, u.avatar_url,
              r.id as recipient_user_id, r.first_name as recipient_first_name,
              r.last_name as recipient_last_name, r.email as recipient_email,
              r.avatar_url as recipient_avatar_url,
              rm.id as reply_id, rm.content as reply_content, rm.user_id as reply_user_id,
              ru.first_name as reply_first_name, ru.last_name as reply_last_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN users r ON m.recipient_id = r.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.user_id = ru.id
       WHERE m.id = $1`,
      [messageId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found');
    }

    const message = result.rows[0];

    // Check project access
    const hasAccess = await projectService.userHasAccess(message.project_id, userId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this message');
    }

    if (
      message.recipient_id &&
      message.user_id !== userId &&
      message.recipient_id !== userId
    ) {
      throw new ForbiddenError('You do not have access to this direct message');
    }

    return this.mapMessage(message);
  }

  // Create a new message
  async createMessage(
    projectId: string,
    userId: string,
    data: CreateMessageInput
  ): Promise<Message> {
    if (data.recipientId) {
      throw new ForbiddenError('Use direct message endpoint for individual chat');
    }

    // Check project access
    const hasAccess = await projectService.userHasAccess(projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this project');
    }

    // If replying to a message, verify it exists in the same project
    if (data.replyToId) {
      const replyResult = await query(
        'SELECT id FROM messages WHERE id = $1 AND project_id = $2',
        [data.replyToId, projectId]
      );
      if (replyResult.rows.length === 0) {
        throw new NotFoundError('Reply target message not found');
      }
    }

    // Create message
    const result = await query(
      `INSERT INTO messages (content, project_id, user_id, reply_to_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [data.content, projectId, userId, data.replyToId]
    );

    const createdMessage = await this.getMessageById(result.rows[0].id, userId);

    await this.notifyProjectMessageRecipients(projectId, userId, createdMessage.content);

    return createdMessage;
  }

  // Create a direct message
  async createDirectMessage(
    projectId: string,
    senderId: string,
    recipientId: string,
    data: CreateMessageInput
  ): Promise<Message> {
    if (senderId === recipientId) {
      throw new ForbiddenError('You cannot message yourself');
    }

    const senderHasAccess = await projectService.userHasAccess(projectId, senderId);
    if (!senderHasAccess) {
      throw new ForbiddenError('You do not have access to this project');
    }

    const recipientHasAccess = await projectService.userHasAccess(projectId, recipientId);
    if (!recipientHasAccess) {
      throw new NotFoundError('Project member not found');
    }

    if (data.replyToId) {
      const replyResult = await query(
        `SELECT id FROM messages
         WHERE id = $1
           AND project_id = $2
           AND ((user_id = $3 AND recipient_id = $4) OR (user_id = $4 AND recipient_id = $3))`,
        [data.replyToId, projectId, senderId, recipientId]
      );
      if (replyResult.rows.length === 0) {
        throw new NotFoundError('Reply target message not found in this chat');
      }
    }

    const result = await query(
      `INSERT INTO messages (content, project_id, user_id, recipient_id, reply_to_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.content, projectId, senderId, recipientId, data.replyToId]
    );

    const createdMessage = await this.getMessageById(result.rows[0].id, senderId);

    const senderName = createdMessage.user
      ? `${createdMessage.user.firstName} ${createdMessage.user.lastName}`.trim()
      : 'A team member';

    await notificationService.createNotification({
      userId: recipientId,
      type: 'message_received',
      title: 'New direct message',
      message: `${senderName} sent you a message: "${this.truncateMessage(createdMessage.content)}"`,
      metadata: { projectId, senderId },
    });

    return createdMessage;
  }

  // Update a message
  async updateMessage(
    messageId: string,
    userId: string,
    data: UpdateMessageInput
  ): Promise<Message> {
    // Get message
    const existingMessage = await this.getMessageById(messageId, userId);

    // Check ownership
    if (existingMessage.userId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    // Update message
    await query(
      `UPDATE messages SET content = $1, is_edited = true WHERE id = $2`,
      [data.content, messageId]
    );

    return this.getMessageById(messageId, userId);
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Get message
    const existingMessage = await this.getMessageById(messageId, userId);

    // Check ownership
    if (existingMessage.userId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    await query('DELETE FROM messages WHERE id = $1', [messageId]);
  }

  // Get recent messages for a project (for initial load)
  async getRecentMessages(
    projectId: string,
    userId: string,
    limit: number = 50
  ): Promise<Message[]> {
    // Check project access
    const hasAccess = await projectService.userHasAccess(projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this project');
    }

    const result = await query(
      `SELECT m.id, m.content, m.project_id, m.user_id, m.reply_to_id, 
          m.recipient_id,
              m.is_edited, m.created_at, m.updated_at,
              u.id as user_id, u.first_name, u.last_name, u.email, u.avatar_url,
          r.id as recipient_user_id, r.first_name as recipient_first_name,
          r.last_name as recipient_last_name, r.email as recipient_email,
          r.avatar_url as recipient_avatar_url,
              rm.id as reply_id, rm.content as reply_content, rm.user_id as reply_user_id,
              ru.first_name as reply_first_name, ru.last_name as reply_last_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
        LEFT JOIN users r ON m.recipient_id = r.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.user_id = ru.id
        WHERE m.project_id = $1 AND m.recipient_id IS NULL
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [projectId, limit]
    );

    // Reverse to get oldest first
    return result.rows.map(this.mapMessage).reverse();
  }

  // Map database row to Message object
  private mapMessage(row: any): Message {
    return {
      id: row.id,
      content: row.content,
      projectId: row.project_id,
      userId: row.user_id,
      recipientId: row.recipient_id || undefined,
      user: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        avatarUrl: row.avatar_url,
      },
      recipient: row.recipient_user_id ? {
        id: row.recipient_user_id,
        firstName: row.recipient_first_name,
        lastName: row.recipient_last_name,
        email: row.recipient_email,
        avatarUrl: row.recipient_avatar_url,
      } : undefined,
      replyToId: row.reply_to_id,
      replyTo: row.reply_id ? {
        id: row.reply_id,
        content: row.reply_content,
        projectId: row.project_id,
        userId: row.reply_user_id,
        user: {
          id: row.reply_user_id,
          firstName: row.reply_first_name,
          lastName: row.reply_last_name,
          email: '',
        },
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined,
      isEdited: row.is_edited,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const chatService = new ChatService();
