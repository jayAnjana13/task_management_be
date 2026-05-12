import { Request, Response } from 'express';
import { userService } from './user.service';
import { successResponse, paginatedResponse, noContentResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/errorHandler';
import { getQueryParams, calculatePaginationMeta } from '../../utils/pagination';

const ALLOWED_SORT_FIELDS = ['created_at', 'email', 'first_name', 'last_name', 'role'];
const ALLOWED_FILTERS = ['role', 'isActive'];

// Get all users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const params = getQueryParams(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
  const { users, total } = await userService.getUsers(params);
  const pagination = calculatePaginationMeta(params.page, params.limit, total);
  
  paginatedResponse(res, users, pagination);
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  
  successResponse(res, user);
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(
    req.params.id,
    req.user!.id,
    req.user!.role,
    req.body
  );
  
  successResponse(res, user, 'User updated successfully');
});

// Update user role (admin only)
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role);
  
  successResponse(res, user, 'User role updated successfully');
});

// Deactivate user (admin only)
export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deactivateUser(req.params.id);
  
  successResponse(res, null, 'User deactivated successfully');
});

// Activate user (admin only)
export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.activateUser(req.params.id);
  
  successResponse(res, null, 'User activated successfully');
});

// Delete user (admin only)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.id);
  
  noContentResponse(res);
});
