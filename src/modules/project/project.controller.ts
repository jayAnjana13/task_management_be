import { Request, Response } from 'express';
import { projectService } from './project.service';
import { successResponse, createdResponse, paginatedResponse, noContentResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/errorHandler';
import { getQueryParams, calculatePaginationMeta } from '../../utils/pagination';

const ALLOWED_SORT_FIELDS = ['created_at', 'name', 'status', 'updated_at'];
const ALLOWED_FILTERS = ['status'];

// Get all projects for current user
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const params = getQueryParams(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
  const { projects, total } = await projectService.getProjects(req.user!.id, params);
  const pagination = calculatePaginationMeta(params.page, params.limit, total);
  
  paginatedResponse(res, projects, pagination);
});

// Get project by ID
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.params.id, req.user!.id);
  
  successResponse(res, project);
});

// Create new project
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.user!.id, req.body);
  
  createdResponse(res, project, 'Project created successfully');
});

// Update project
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(
    req.params.id,
    req.user!.id,
    req.body
  );
  
  successResponse(res, project, 'Project updated successfully');
});

// Delete project
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.id, req.user!.id);
  
  noContentResponse(res);
});

// Get project members
export const getProjectMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await projectService.getProjectMembers(req.params.id, req.user!.id);
  
  successResponse(res, members);
});

// Add member to project
export const addProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const member = await projectService.addMember(
    req.params.id,
    req.user!.id,
    req.body
  );
  
  createdResponse(res, member, 'Member added successfully');
});

// Remove member from project
export const removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
  await projectService.removeMember(
    req.params.id,
    req.params.memberId,
    req.user!.id
  );
  
  noContentResponse(res);
});

// Admin: Get ALL projects in system
export const getAllProjectsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const params = getQueryParams(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
  const { projects, total } = await projectService.getAllProjectsAdmin(params);
  const pagination = calculatePaginationMeta(params.page, params.limit, total);
  
  paginatedResponse(res, projects, pagination);
});

// Admin: Get project by ID (bypass membership check)
export const getProjectByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.params.id, req.user!.id, req.user!.role);
  
  successResponse(res, project);
});
