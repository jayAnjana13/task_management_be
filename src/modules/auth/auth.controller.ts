import { Request, Response } from 'express';
import { authService } from './auth.service';
import { successResponse, createdResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../../utils/validation';

// Register new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data: RegisterInput = req.body;
  const result = await authService.register(data);
  
  createdResponse(res, result, 'Registration successful');
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const data: LoginInput = req.body;
  const result = await authService.login(data);
  
  successResponse(res, result, 'Login successful');
});

// Refresh token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  
  successResponse(res, tokens, 'Token refreshed successfully');
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  
  successResponse(res, user);
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  
  successResponse(res, null, 'Password changed successfully');
});

// Logout (client-side token removal, server-side just returns success)
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // In a production app, you might want to:
  // - Add the token to a blacklist
  // - Invalidate refresh tokens in the database
  
  successResponse(res, null, 'Logout successful');
});
