import { query } from "../../database";
import { NotFoundError, ForbiddenError } from "../../utils/errors";
import { CreateTaskInput, UpdateTaskInput } from "../../utils/validation";
import {
  QueryParams,
  buildWhereClause,
  buildSearchClause,
} from "../../utils/pagination";
import { projectService } from "../project/project.service";
import { notificationService } from "../notification";

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

class TaskService {
  // Get tasks with pagination, filtering, and search
  async getTasks(
    userId: string,
    projectId: string | null,
    params: QueryParams,
  ): Promise<TaskListResult> {
    const { page, limit, offset, sortBy, sortOrder, search, filters } = params;

    // Start building query
    let baseCondition = "";
    const baseParams: any[] = [userId];
    let paramIndex = 2;

    if (projectId) {
      // Check project access
      const hasAccess = await projectService.userHasAccess(projectId, userId);
      if (!hasAccess) {
        throw new ForbiddenError("You do not have access to this project");
      }
      baseCondition = "AND t.project_id = $2";
      baseParams.push(projectId);
      paramIndex = 3;
    }

    // Handle assignedToMe filter
    let assignedToMeCondition = "";
    if (filters.assignedToMe) {
      assignedToMeCondition = `AND t.assignee_id = $1`;
    }
    delete filters.assignedToMe; // Remove from filters to avoid processing in buildWhereClause

    // Build filter clause
    const allowedFilterMapping: Record<string, string> = {
      status: "t.status",
      priority: "t.priority",
      assigneeId: "t.assignee_id",
      projectId: "t.project_id",
    };

    const {
      clause: filterClause,
      params: filterParams,
      nextParamIndex,
    } = buildWhereClause(filters, allowedFilterMapping, paramIndex);

    // Build search clause
    const { clause: searchClause, params: searchParams } = buildSearchClause(
      search,
      ["t.title", "t.description"],
      nextParamIndex,
    );

    const allParams = [...baseParams, ...filterParams, ...searchParams];

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
      ${baseCondition} ${filterClause} ${searchClause} ${assignedToMeCondition}
    `;
    const countResult = await query(countQuery, allParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Map sort fields
    const sortFieldMap: Record<string, string> = {
      created_at: "t.created_at",
      updated_at: "t.updated_at",
      title: "t.title",
      status: "t.status",
      priority: "t.priority",
      due_date: "t.due_date",
      position: "t.position",
    };
    const sortField = sortFieldMap[sortBy] || "t.created_at";

    // Get tasks
    const tasksQuery = `
      SELECT t.id, t.title, t.description, t.status, t.priority, 
             t.project_id, t.assignee_id, t.reporter_id, t.due_date,
             t.estimated_hours, t.actual_hours, t.tags, t.position,
             t.created_at, t.updated_at,
             p.id as project_id, p.name as project_name,
             a.id as assignee_user_id, a.first_name as assignee_first_name, 
             a.last_name as assignee_last_name, a.email as assignee_email, 
             a.avatar_url as assignee_avatar,
             r.id as reporter_user_id, r.first_name as reporter_first_name, 
             r.last_name as reporter_last_name, r.email as reporter_email
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN users r ON t.reporter_id = r.id
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
      ${baseCondition} ${filterClause} ${searchClause} ${assignedToMeCondition}
      GROUP BY t.id, p.id, a.id, r.id
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${allParams.length + 1} OFFSET $${allParams.length + 2}
    `;
    const tasksResult = await query(tasksQuery, [...allParams, limit, offset]);

    const tasks = tasksResult.rows.map(this.mapTask);

    return { tasks, total };
  }

  // Get task by ID
  async getTaskById(taskId: string, userId: string): Promise<Task> {
    const result = await query(
      `SELECT t.id, t.title, t.description, t.status, t.priority, 
              t.project_id, t.assignee_id, t.reporter_id, t.due_date,
              t.estimated_hours, t.actual_hours, t.tags, t.position,
              t.created_at, t.updated_at,
              p.id as project_id, p.name as project_name,
              a.id as assignee_user_id, a.first_name as assignee_first_name, 
              a.last_name as assignee_last_name, a.email as assignee_email, 
              a.avatar_url as assignee_avatar,
              r.id as reporter_user_id, r.first_name as reporter_first_name, 
              r.last_name as reporter_last_name, r.email as reporter_email
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users a ON t.assignee_id = a.id
       LEFT JOIN users r ON t.reporter_id = r.id
       WHERE t.id = $1`,
      [taskId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundError("Task not found");
    }

    const task = result.rows[0];

    // Check project access
    const hasAccess = await projectService.userHasAccess(
      task.project_id,
      userId,
    );
    if (!hasAccess) {
      throw new ForbiddenError("You do not have access to this task");
    }

    return this.mapTask(task);
  }

  // Validate assignee is a project member
  private async validateAssignee(
    projectId: string,
    assigneeId?: string,
  ): Promise<void> {
    if (!assigneeId) return;

    const result = await query(
      `SELECT pm.id FROM project_members pm
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, assigneeId],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenError("Assignee must be a member of the project");
    }
  }

  // Create new task
  async createTask(userId: string, data: CreateTaskInput): Promise<Task> {
    // Check project access
    const hasAccess = await projectService.userHasAccess(
      data.projectId,
      userId,
    );
    if (!hasAccess) {
      throw new ForbiddenError("You do not have access to this project");
    }

    // Validate assignee is a project member
    await this.validateAssignee(data.projectId, data.assigneeId ?? undefined);

    // Get next position
    const positionResult = await query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position 
       FROM tasks WHERE project_id = $1`,
      [data.projectId],
    );
    const position = positionResult.rows[0].next_position;

    // Create task
    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, project_id, 
                          assignee_id, reporter_id, due_date, estimated_hours, tags, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        data.title,
        data.description,
        data.status || "todo",
        data.priority || "medium",
        data.projectId,
        data.assigneeId,
        userId,
        data.dueDate,
        data.estimatedHours,
        data.tags || [],
        position,
      ],
    );

    const task = await this.getTaskById(result.rows[0].id, userId);

    if (task.assigneeId && task.assigneeId !== userId) {
      await notificationService.createNotification({
        userId: task.assigneeId,
        type: "task_assigned",
        title: "Task assigned to you",
        message: `You were assigned "${task.title}" in ${task.project?.name || "a project"}.`,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
        },
      });
    }

    return task;
  }

  // Update task
  async updateTask(
    taskId: string,
    userId: string,
    data: UpdateTaskInput,
  ): Promise<Task> {
    // Get task and check access
    const existingTask = await this.getTaskById(taskId, userId);

    // Validate assignee if being updated
    if (data.assigneeId !== undefined) {
      await this.validateAssignee(
        existingTask.projectId,
        data.assigneeId || undefined,
      );
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: "title",
      description: "description",
      status: "status",
      priority: "priority",
      assigneeId: "assignee_id",
      dueDate: "due_date",
      estimatedHours: "estimated_hours",
      actualHours: "actual_hours",
      tags: "tags",
      position: "position",
    };

    for (const [key, field] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push((data as any)[key]);
      }
    }

    if (updates.length === 0) {
      return existingTask;
    }

    params.push(taskId);

    await query(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      params,
    );

    const updatedTask = await this.getTaskById(taskId, userId);

    if (
      updatedTask.assigneeId &&
      updatedTask.assigneeId !== existingTask.assigneeId &&
      updatedTask.assigneeId !== userId
    ) {
      await notificationService.createNotification({
        userId: updatedTask.assigneeId,
        type: "task_assigned",
        title: "Task assigned to you",
        message: `You were assigned "${updatedTask.title}" in ${updatedTask.project?.name || "a project"}.`,
        metadata: {
          taskId: updatedTask.id,
          projectId: updatedTask.projectId,
        },
      });
    }

    return updatedTask;
  }

  // Delete task
  async deleteTask(taskId: string, userId: string): Promise<void> {
    // Check access
    await this.getTaskById(taskId, userId);

    const result = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [
      taskId,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError("Task not found");
    }
  }

  // Update task positions (for drag and drop)
  async updateTaskPositions(
    updates: Array<{ id: string; position: number; status?: string }>,
    userId: string,
  ): Promise<void> {
    for (const update of updates) {
      // Check access
      await this.getTaskById(update.id, userId);

      const setClause = update.status
        ? "position = $1, status = $2"
        : "position = $1";
      const params = update.status
        ? [update.position, update.status, update.id]
        : [update.position, update.id];

      await query(
        `UPDATE tasks SET ${setClause} WHERE id = $${params.length}`,
        params,
      );
    }
  }

  // Get task statistics for a project
  async getTaskStats(projectId: string, userId: string): Promise<any> {
    // Check access
    const hasAccess = await projectService.userHasAccess(projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenError("You do not have access to this project");
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'todo') as todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'review') as review,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP AND status != 'done') as overdue
       FROM tasks WHERE project_id = $1`,
      [projectId],
    );

    return {
      total: parseInt(result.rows[0].total, 10),
      byStatus: {
        todo: parseInt(result.rows[0].todo, 10),
        inProgress: parseInt(result.rows[0].in_progress, 10),
        review: parseInt(result.rows[0].review, 10),
        done: parseInt(result.rows[0].done, 10),
      },
      urgent: parseInt(result.rows[0].urgent, 10),
      highPriority: parseInt(result.rows[0].high_priority, 10),
      overdue: parseInt(result.rows[0].overdue, 10),
    };
  }

  // Map database row to Task object
  private mapTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      projectId: row.project_id,
      project: row.project_name
        ? {
            id: row.project_id,
            name: row.project_name,
          }
        : undefined,
      assigneeId: row.assignee_id,
      assignee: row.assignee_user_id
        ? {
            id: row.assignee_user_id,
            firstName: row.assignee_first_name,
            lastName: row.assignee_last_name,
            email: row.assignee_email,
            avatarUrl: row.assignee_avatar,
          }
        : undefined,
      reporterId: row.reporter_id,
      reporter: row.reporter_user_id
        ? {
            id: row.reporter_user_id,
            firstName: row.reporter_first_name,
            lastName: row.reporter_last_name,
            email: row.reporter_email,
          }
        : undefined,
      dueDate: row.due_date,
      estimatedHours: row.estimated_hours
        ? parseFloat(row.estimated_hours)
        : undefined,
      actualHours: row.actual_hours ? parseFloat(row.actual_hours) : undefined,
      tags: row.tags || [],
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const taskService = new TaskService();
