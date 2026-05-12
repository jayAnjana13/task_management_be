"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectByIdAdmin = exports.getAllProjectsAdmin = exports.removeProjectMember = exports.addProjectMember = exports.getProjectMembers = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const project_service_1 = require("./project.service");
const response_1 = require("../../utils/response");
const errorHandler_1 = require("../../middleware/errorHandler");
const pagination_1 = require("../../utils/pagination");
const ALLOWED_SORT_FIELDS = ['created_at', 'name', 'status', 'updated_at'];
const ALLOWED_FILTERS = ['status'];
// Get all projects for current user
exports.getProjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = (0, pagination_1.getQueryParams)(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
    const { projects, total } = await project_service_1.projectService.getProjects(req.user.id, params);
    const pagination = (0, pagination_1.calculatePaginationMeta)(params.page, params.limit, total);
    (0, response_1.paginatedResponse)(res, projects, pagination);
});
// Get project by ID
exports.getProjectById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const project = await project_service_1.projectService.getProjectById(req.params.id, req.user.id);
    (0, response_1.successResponse)(res, project);
});
// Create new project
exports.createProject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const project = await project_service_1.projectService.createProject(req.user.id, req.body);
    (0, response_1.createdResponse)(res, project, 'Project created successfully');
});
// Update project
exports.updateProject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const project = await project_service_1.projectService.updateProject(req.params.id, req.user.id, req.body);
    (0, response_1.successResponse)(res, project, 'Project updated successfully');
});
// Delete project
exports.deleteProject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await project_service_1.projectService.deleteProject(req.params.id, req.user.id);
    (0, response_1.noContentResponse)(res);
});
// Get project members
exports.getProjectMembers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const members = await project_service_1.projectService.getProjectMembers(req.params.id, req.user.id);
    (0, response_1.successResponse)(res, members);
});
// Add member to project
exports.addProjectMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const member = await project_service_1.projectService.addMember(req.params.id, req.user.id, req.body);
    (0, response_1.createdResponse)(res, member, 'Member added successfully');
});
// Remove member from project
exports.removeProjectMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await project_service_1.projectService.removeMember(req.params.id, req.params.memberId, req.user.id);
    (0, response_1.noContentResponse)(res);
});
// Admin: Get ALL projects in system
exports.getAllProjectsAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = (0, pagination_1.getQueryParams)(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
    const { projects, total } = await project_service_1.projectService.getAllProjectsAdmin(params);
    const pagination = (0, pagination_1.calculatePaginationMeta)(params.page, params.limit, total);
    (0, response_1.paginatedResponse)(res, projects, pagination);
});
// Admin: Get project by ID (bypass membership check)
exports.getProjectByIdAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const project = await project_service_1.projectService.getProjectById(req.params.id, req.user.id, req.user.role);
    (0, response_1.successResponse)(res, project);
});
//# sourceMappingURL=project.controller.js.map