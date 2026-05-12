import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { chatService, Message } from './chat.service';
import { projectService } from '../project/project.service';
import { query } from '../../database';
import { setSocketServer } from '../../realtime/socketEmitter';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    firstName: string;
    lastName: string;
  };
}

interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

interface TypingPayload {
  projectId: string;
  recipientId?: string;
}

// Store active users per project
const projectUsers = new Map<string, Set<string>>();

export function initializeSocketIO(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  setSocketServer(io);

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      // Get user from database
      const result = await query(
        `SELECT id, email, role, first_name, last_name, is_active 
         FROM users WHERE id = $1`,
        [decoded.userId]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return next(new Error('User not found or inactive'));
      }

      const user = result.rows[0];
      socket.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.email}`);

    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join project room
    socket.on('join-project', async (projectId: string) => {
      try {
        if (!socket.user) return;

        // Verify user has access to project
        const hasAccess = await projectService.userHasAccess(projectId, socket.user.id);
        if (!hasAccess) {
          socket.emit('error', { message: 'You do not have access to this project' });
          return;
        }

        // Join the room
        socket.join(`project:${projectId}`);

        // Track active users
        if (!projectUsers.has(projectId)) {
          projectUsers.set(projectId, new Set());
        }
        projectUsers.get(projectId)!.add(socket.user.id);

        // Notify room about new user
        io.to(`project:${projectId}`).emit('user-joined', {
          user: {
            id: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
          },
          activeUsers: Array.from(projectUsers.get(projectId)!),
        });

        // Send recent messages
        const messages = await chatService.getRecentMessages(projectId, socket.user.id);
        socket.emit('initial-messages', messages);

        console.log(`User ${socket.user.email} joined project ${projectId}`);
      } catch (error) {
        console.error('Join project error:', error);
        socket.emit('error', { message: 'Failed to join project' });
      }
    });

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      if (!socket.user) return;

      socket.leave(`project:${projectId}`);

      // Remove from active users
      if (projectUsers.has(projectId)) {
        projectUsers.get(projectId)!.delete(socket.user.id);
        if (projectUsers.get(projectId)!.size === 0) {
          projectUsers.delete(projectId);
        }
      }

      // Notify room about user leaving
      io.to(`project:${projectId}`).emit('user-left', {
        userId: socket.user.id,
        activeUsers: projectUsers.has(projectId)
          ? Array.from(projectUsers.get(projectId)!)
          : [],
      });

      console.log(`User ${socket.user.email} left project ${projectId}`);
    });

    // Send message
    socket.on('send-message', async (data: { projectId: string; content: string; replyToId?: string }) => {
      try {
        if (!socket.user) return;

        const message = await chatService.createMessage(
          data.projectId,
          socket.user.id,
          { content: data.content, replyToId: data.replyToId }
        );

        // Broadcast to all users in the project (including sender)
        io.to(`project:${data.projectId}`).emit('new-message', message);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Send direct message
    socket.on(
      'send-direct-message',
      async (data: { projectId: string; recipientId: string; content: string; replyToId?: string }) => {
        try {
          if (!socket.user) return;

          const message = await chatService.createDirectMessage(
            data.projectId,
            socket.user.id,
            data.recipientId,
            { content: data.content, replyToId: data.replyToId, recipientId: data.recipientId }
          );

          io.to(`user:${socket.user.id}`).emit('new-message', message);
          io.to(`user:${data.recipientId}`).emit('new-message', message);
        } catch (error) {
          console.error('Send direct message error:', error);
          socket.emit('error', { message: 'Failed to send direct message' });
        }
      }
    );

    // Edit message
    socket.on('edit-message', async (data: { messageId: string; content: string }) => {
      try {
        if (!socket.user) return;

        const message = await chatService.updateMessage(
          data.messageId,
          socket.user.id,
          { content: data.content }
        );

        if (message.recipientId) {
          io.to(`user:${message.userId}`).emit('message-updated', message);
          io.to(`user:${message.recipientId}`).emit('message-updated', message);
        } else {
          io.to(`project:${message.projectId}`).emit('message-updated', message);
        }
      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('delete-message', async (data: { messageId: string; projectId: string }) => {
      try {
        if (!socket.user) return;

        const existingMessage = await chatService.getMessageById(data.messageId, socket.user.id);

        await chatService.deleteMessage(data.messageId, socket.user.id);

        if (existingMessage.recipientId) {
          io.to(`user:${existingMessage.userId}`).emit('message-deleted', {
            messageId: data.messageId,
          });
          io.to(`user:${existingMessage.recipientId}`).emit('message-deleted', {
            messageId: data.messageId,
          });
        } else {
          io.to(`project:${data.projectId}`).emit('message-deleted', {
            messageId: data.messageId,
          });
        }
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Typing indicator
    socket.on('typing-start', async (payload: string | TypingPayload) => {
      if (!socket.user) return;

      const typedPayload = typeof payload === 'string' ? { projectId: payload } : payload;

      if (typedPayload.recipientId) {
        const [senderHasAccess, recipientHasAccess] = await Promise.all([
          projectService.userHasAccess(typedPayload.projectId, socket.user.id),
          projectService.userHasAccess(typedPayload.projectId, typedPayload.recipientId),
        ]);

        if (!senderHasAccess || !recipientHasAccess) {
          return;
        }

        io.to(`user:${typedPayload.recipientId}`).emit('user-typing', {
          userId: socket.user.id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          recipientId: typedPayload.recipientId,
          projectId: typedPayload.projectId,
        });
        return;
      }

      socket.to(`project:${typedPayload.projectId}`).emit('user-typing', {
        userId: socket.user.id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
      });
    });

    socket.on('typing-stop', async (payload: string | TypingPayload) => {
      if (!socket.user) return;

      const typedPayload = typeof payload === 'string' ? { projectId: payload } : payload;

      if (typedPayload.recipientId) {
        const [senderHasAccess, recipientHasAccess] = await Promise.all([
          projectService.userHasAccess(typedPayload.projectId, socket.user.id),
          projectService.userHasAccess(typedPayload.projectId, typedPayload.recipientId),
        ]);

        if (!senderHasAccess || !recipientHasAccess) {
          return;
        }

        io.to(`user:${typedPayload.recipientId}`).emit('user-stopped-typing', {
          userId: socket.user.id,
          recipientId: typedPayload.recipientId,
          projectId: typedPayload.projectId,
        });
        return;
      }

      socket.to(`project:${typedPayload.projectId}`).emit('user-stopped-typing', {
        userId: socket.user.id,
      });
    });

    // Get active users in a project
    socket.on('get-active-users', (projectId: string) => {
      const activeUsers = projectUsers.has(projectId)
        ? Array.from(projectUsers.get(projectId)!)
        : [];
      socket.emit('active-users', { projectId, activeUsers });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      if (!socket.user) return;

      // Remove user from all project rooms
      projectUsers.forEach((users, projectId) => {
        if (users.has(socket.user!.id)) {
          users.delete(socket.user!.id);
          console.log(`User ${socket.user!.email} left project ${projectId}`);
          // Notify project rooms
          io.to(`project:${projectId}`).emit('user-left', {
            userId: socket.user!.id,
            activeUsers: Array.from(users),
          });

          if (users.size === 0) {
            projectUsers.delete(projectId);
          }
        }
      });

      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  return io;
}

// Export for use in other parts of the application
export { projectUsers };
