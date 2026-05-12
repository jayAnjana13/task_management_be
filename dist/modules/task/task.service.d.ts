import { CreateTaskInput, UpdateTaskInput } from "../../utils/validation";
import { QueryParams } from "../../utils/pagination";
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "review" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    projectId: string;
    project?: {
        id: string;
        name: string;
    };
    assigneeId?: string;
    assignee?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
    };
    reporterId: string;
    reporter?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface TaskListResult {
    tasks: Task[];
    total: number;
}
declare class TaskService {
    getTasks(userId: string, projectId: string | null, params: QueryParams): Promise<TaskListResult>;
    getTaskById(taskId: string, userId: string): Promise<Task>;
    private validateAssignee;
    createTask(userId: string, data: CreateTaskInput): Promise<Task>;
    updateTask(taskId: string, userId: string, data: UpdateTaskInput): Promise<Task>;
    deleteTask(taskId: string, userId: string): Promise<void>;
    updateTaskPositions(updates: Array<{
        id: string;
        position: number;
        status?: string;
    }>, userId: string): Promise<void>;
    getTaskStats(projectId: string, userId: string): Promise<any>;
    private mapTask;
}
export declare const taskService: TaskService;
export {};
//# sourceMappingURL=task.service.d.ts.map