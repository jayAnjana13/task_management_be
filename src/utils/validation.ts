import { z } from 'zod';

// Common validators
export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format').toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .trim();

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().transform(val => val?.toUpperCase()),
  search: z.string().optional(),
});

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User schemas
export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  avatarUrl: z.string().url('Invalid URL format').optional().nullable(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'user']),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255).trim(),
  description: z.string().max(2000).optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
});

export const addProjectMemberSchema = z.object({
  userId: uuidSchema,
  role: z.string().max(50).optional().default('member'),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255).trim(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  projectId: uuidSchema,
  assigneeId: uuidSchema.optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: uuidSchema.optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  actualHours: z.number().positive().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  position: z.number().int().min(0).optional(),
});

export const taskFilterSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: uuidSchema.optional(),
  projectId: uuidSchema.optional(),
});

// Message schemas
export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000).trim(),
  replyToId: uuidSchema.optional().nullable(),
  recipientId: uuidSchema.optional().nullable(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
