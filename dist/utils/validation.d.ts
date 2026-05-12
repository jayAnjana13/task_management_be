import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const nameSchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodEffects<z.ZodOptional<z.ZodEnum<["ASC", "DESC", "asc", "desc"]>>, string | undefined, "ASC" | "DESC" | "asc" | "desc" | undefined>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy?: string | undefined;
    sortOrder?: string | undefined;
    search?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "ASC" | "DESC" | "asc" | "desc" | undefined;
    search?: string | undefined;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
}, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    avatarUrl?: string | null | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    avatarUrl?: string | null | undefined;
}>;
export declare const updateUserRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["admin", "user"]>;
}, "strip", z.ZodTypeAny, {
    role: "user" | "admin";
}, {
    role: "user" | "admin";
}>;
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | null | undefined;
}, {
    name: string;
    description?: string | null | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["active", "archived", "completed"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "archived" | "completed" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
}, {
    status?: "active" | "archived" | "completed" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
}>;
export declare const addProjectMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    role: string;
}, {
    userId: string;
    role?: string | undefined;
}>;
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["todo", "in_progress", "review", "done"]>>>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>>;
    projectId: z.ZodString;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    estimatedHours: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "todo" | "in_progress" | "review" | "done";
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    projectId: string;
    description?: string | null | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
    estimatedHours?: number | null | undefined;
    tags?: string[] | undefined;
}, {
    title: string;
    projectId: string;
    status?: "todo" | "in_progress" | "review" | "done" | undefined;
    description?: string | null | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
    estimatedHours?: number | null | undefined;
    tags?: string[] | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["todo", "in_progress", "review", "done"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    estimatedHours: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    actualHours: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "todo" | "in_progress" | "review" | "done" | undefined;
    description?: string | null | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
    estimatedHours?: number | null | undefined;
    tags?: string[] | undefined;
    actualHours?: number | null | undefined;
    position?: number | undefined;
}, {
    status?: "todo" | "in_progress" | "review" | "done" | undefined;
    description?: string | null | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
    estimatedHours?: number | null | undefined;
    tags?: string[] | undefined;
    actualHours?: number | null | undefined;
    position?: number | undefined;
}>;
export declare const taskFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["todo", "in_progress", "review", "done"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    assigneeId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "todo" | "in_progress" | "review" | "done" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    projectId?: string | undefined;
    assigneeId?: string | undefined;
}, {
    status?: "todo" | "in_progress" | "review" | "done" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    projectId?: string | undefined;
    assigneeId?: string | undefined;
}>;
export declare const createMessageSchema: z.ZodObject<{
    content: z.ZodString;
    replyToId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    recipientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    replyToId?: string | null | undefined;
    recipientId?: string | null | undefined;
}, {
    content: string;
    replyToId?: string | null | undefined;
    recipientId?: string | null | undefined;
}>;
export declare const updateMessageSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
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
//# sourceMappingURL=validation.d.ts.map