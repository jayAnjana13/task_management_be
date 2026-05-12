import { Request, Response } from 'express';
import { chatService } from './chat.service';
import { successResponse, paginatedResponse, noContentResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/errorHandler';
import { getQueryParams, calculatePaginationMeta } from '../../utils/pagination';

// Get messages for a project
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const params = getQueryParams(req, ['created_at'], []);
  const { messages, total } = await chatService.getMessages(
    req.params.projectId,
    req.user!.id,
    params
  );
  const pagination = calculatePaginationMeta(params.page, params.limit, total);
  
  paginatedResponse(res, messages, pagination);
});

// Get direct messages between current user and a project member
export const getDirectMessages = asyncHandler(async (req: Request, res: Response) => {
  const params = getQueryParams(req, ['created_at'], []);
  const { messages, total } = await chatService.getDirectMessages(
    req.params.projectId,
    req.user!.id,
    req.params.memberId,
    params
  );
  const pagination = calculatePaginationMeta(params.page, params.limit, total);

  paginatedResponse(res, messages, pagination);
});

// Get single message
export const getMessageById = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.getMessageById(req.params.id, req.user!.id);
  
  successResponse(res, message);
});

// Create message (also available via WebSocket)
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.createMessage(
    req.params.projectId,
    req.user!.id,
    req.body
  );
  
  successResponse(res, message, 'Message sent successfully', 201);
});

// Create direct message to a project member
export const createDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.createDirectMessage(
    req.params.projectId,
    req.user!.id,
    req.params.memberId,
    req.body
  );

  successResponse(res, message, 'Direct message sent successfully', 201);
});

// Update message
export const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.updateMessage(
    req.params.id,
    req.user!.id,
    req.body
  );
  
  successResponse(res, message, 'Message updated successfully');
});

// Delete message
export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  await chatService.deleteMessage(req.params.id, req.user!.id);
  
  noContentResponse(res);
});

// Admin: Get messages for any project
export const getMessagesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const params = getQueryParams(req, ['created_at'], []);
  const { messages, total } = await chatService.getMessages(
    req.params.projectId,
    req.user!.id,
    params,
    req.user!.role
  );
  const pagination = calculatePaginationMeta(params.page, params.limit, total);
  
  paginatedResponse(res, messages, pagination);
});
