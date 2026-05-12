"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskStats = exports.updateTaskPositions = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const task_service_1 = require("./task.service");
const response_1 = require("../../utils/response");
const errorHandler_1 = require("../../middleware/errorHandler");
const pagination_1 = require("../../utils/pagination");
const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'title', 'status', 'priority', 'due_date', 'position'];
const ALLOWED_FILTERS = ['status', 'priority', 'assigneeId', 'projectId', 'assignedToMe'];
// Get all tasks
exports.getTasks = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = (0, pagination_1.getQueryParams)(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
    const projectId = req.query.projectId;
    const { tasks, total } = await task_service_1.taskService.getTasks(req.user.id, projectId || null, params);
    const pagination = (0, pagination_1.calculatePaginationMeta)(params.page, params.limit, total);
    (0, response_1.paginatedResponse)(res, tasks, pagination);
});
// Get task by ID
exports.getTaskById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const task = await task_service_1.taskService.getTaskById(req.params.id, req.user.id);
    (0, response_1.successResponse)(res, task);
});
// Create new task
exports.createTask = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const task = await task_service_1.taskService.createTask(req.user.id, req.body);
    (0, response_1.createdResponse)(res, task, 'Task created successfully');
});
// Update task
exports.updateTask = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const task = await task_service_1.taskService.updateTask(req.params.id, req.user.id, req.body);
    (0, response_1.successResponse)(res, task, 'Task updated successfully');
});
// Delete task
exports.deleteTask = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await task_service_1.taskService.deleteTask(req.params.id, req.user.id);
    (0, response_1.noContentResponse)(res);
});
// Update task positions (for drag and drop)
exports.updateTaskPositions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await task_service_1.taskService.updateTaskPositions(req.body.updates, req.user.id);
    (0, response_1.successResponse)(res, null, 'Task positions updated successfully');
});
// Get task statistics for a project
exports.getTaskStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await task_service_1.taskService.getTaskStats(req.params.projectId, req.user.id);
    (0, response_1.successResponse)(res, stats);
});
//# sourceMappingURL=task.controller.js.map