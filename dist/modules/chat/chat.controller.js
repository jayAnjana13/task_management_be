"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagesAdmin = exports.deleteMessage = exports.updateMessage = exports.createDirectMessage = exports.createMessage = exports.getMessageById = exports.getDirectMessages = exports.getMessages = void 0;
const chat_service_1 = require("./chat.service");
const response_1 = require("../../utils/response");
const errorHandler_1 = require("../../middleware/errorHandler");
const pagination_1 = require("../../utils/pagination");
// Get messages for a project
exports.getMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = (0, pagination_1.getQueryParams)(req, ['created_at'], []);
    const { messages, total } = await chat_service_1.chatService.getMessages(req.params.projectId, req.user.id, params);
    const pagination = (0, pagination_1.calculatePaginationMeta)(params.page, params.limit, total);
    (0, response_1.paginatedResponse)(res, messages, pagination);
});
// Get direct messages between current user and a project member
exports.getDirectMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = (0, pagination_1.getQueryParams)(req, ['created_at'], []);
    const { messages, total } = await chat_service_1.chatService.getDirectMessages(req.params.projectId, req.user.id, req.params.memberId, params);
    const pagination = (0, pagination_1.calculatePaginationMeta)(params.page, params.limit, total);
    (0, response_1.paginatedResponse)(res, messages, pagination);
});
// Get single message
exports.getMessageById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const message = await chat_service_1.chatService.getMessageById(req.params.id, req.user.id);
    (0, response_1.successResponse)(res, message);
});
// Create message (also available via WebSocket)
exports.createMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const message = await chat_service_1.chatService.createMessage(req.params.projectId, req.user.id, req.body);
    (0, response_1.successResponse)(res, message, 'Message sent successfully', 201);
});
// Create direct message to a project member
exports.createDirectMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const message = await chat_service_1.chatService.createDirectMessage(req.params.projectId, req.user.id, req.params.memberId, req.body);
    (0, response_1.successResponse)(res, message, 'Direct message sent successfully', 201);
});
// Update message
exports.updateMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const message = await chat_service_1.chatService.updateMessage(req.params.id, req.user.id, req.body);
    (0, response_1.successResponse)(res, message, 'Message updated successfully');
});
// Delete message
exports.deleteMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await chat_service_1.chatService.deleteMessage(req.params.id, req.user.id);
    (0, response_1.noContentResponse)(res);
});
// Admin: Get messages for any project
exports.getMessagesAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = (0, pagination_1.getQueryParams)(req, ['created_at'], []);
    const { messages, total } = await chat_service_1.chatService.getMessages(req.params.projectId, req.user.id, params, req.user.role);
    const pagination = (0, pagination_1.calculatePaginationMeta)(params.page, params.limit, total);
    (0, response_1.paginatedResponse)(res, messages, pagination);
});
//# sourceMappingURL=chat.controller.js.map