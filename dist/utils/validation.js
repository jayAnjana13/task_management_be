"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMessageSchema = exports.createMessageSchema = exports.taskFilterSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.addProjectMemberSchema = exports.updateProjectSchema = exports.createProjectSchema = exports.updateUserRoleSchema = exports.updateUserSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.paginationSchema = exports.nameSchema = exports.passwordSchema = exports.emailSchema = exports.uuidSchema = void 0;
const zod_1 = require("zod");
// Common validators
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
exports.emailSchema = zod_1.z.string().email('Invalid email format').toLowerCase();
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');
exports.nameSchema = zod_1.z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim();
// Pagination schemas
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().transform(val => val?.toUpperCase()),
    search: zod_1.z.string().optional(),
});
// Auth schemas
exports.registerSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    firstName: exports.nameSchema,
    lastName: exports.nameSchema,
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
// User schemas
exports.updateUserSchema = zod_1.z.object({
    firstName: exports.nameSchema.optional(),
    lastName: exports.nameSchema.optional(),
    avatarUrl: zod_1.z.string().url('Invalid URL format').optional().nullable(),
});
exports.updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['admin', 'user']),
});
// Project schemas
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(255).trim(),
    description: zod_1.z.string().max(2000).optional().nullable(),
});
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).trim().optional(),
    description: zod_1.z.string().max(2000).optional().nullable(),
    status: zod_1.z.enum(['active', 'archived', 'completed']).optional(),
});
exports.addProjectMemberSchema = zod_1.z.object({
    userId: exports.uuidSchema,
    role: zod_1.z.string().max(50).optional().default('member'),
});
// Task schemas
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Task title is required').max(255).trim(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']).optional().default('todo'),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    projectId: exports.uuidSchema,
    assigneeId: exports.uuidSchema.optional().nullable(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
    estimatedHours: zod_1.z.number().positive().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(10).optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255).trim().optional(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: exports.uuidSchema.optional().nullable(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
    estimatedHours: zod_1.z.number().positive().optional().nullable(),
    actualHours: zod_1.z.number().positive().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(10).optional(),
    position: zod_1.z.number().int().min(0).optional(),
});
exports.taskFilterSchema = zod_1.z.object({
    status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: exports.uuidSchema.optional(),
    projectId: exports.uuidSchema.optional(),
});
// Message schemas
exports.createMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Message content is required').max(5000).trim(),
    replyToId: exports.uuidSchema.optional().nullable(),
    recipientId: exports.uuidSchema.optional().nullable(),
});
exports.updateMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000).trim(),
});
//# sourceMappingURL=validation.js.map