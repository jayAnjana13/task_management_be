import { Request, Response } from 'express';
import { taskService } from './task.service';
import { successResponse, createdResponse, paginatedResponse, noContentResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/errorHandler';
import { getQueryParams, calculatePaginationMeta } from '../../utils/pagination';

const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'title', 'status', 'priority', 'due_date', 'position'];
const ALLOWED_FILTERS = ['status', 'priority', 'assigneeId', 'projectId', 'assignedToMe'];

// Get all tasks
export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const params = getQueryParams(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
  const projectId = req.query.projectId as string | undefined;
  
  const { tasks, total } = await taskService.getTasks(req.user!.id, projectId || null, params);
  const pagination = calculatePaginationMeta(params.page, params.limit, total);
  
  paginatedResponse(res, tasks, pagination);
});

// Get task by ID
export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.params.id, req.user!.id);
  
  successResponse(res, task);
});

// Create new task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.user!.id, req.body);
  
  createdResponse(res, task, 'Task created successfully');
});

// Update task
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.params.id, req.user!.id, req.body);
  
  successResponse(res, task, 'Task updated successfully');
});

// Delete task
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.params.id, req.user!.id);
  
  noContentResponse(res);
});

// Update task positions (for drag and drop)
export const updateTaskPositions = asyncHandler(async (req: Request, res: Response) => {
  await taskService.updateTaskPositions(req.body.updates, req.user!.id);
  
  successResponse(res, null, 'Task positions updated successfully');
});

// Get task statistics for a project
export const getTaskStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await taskService.getTaskStats(req.params.projectId, req.user!.id);
  
  successResponse(res, stats);
});
