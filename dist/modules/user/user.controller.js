"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.activateUser = exports.deactivateUser = exports.updateUserRole = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const user_service_1 = require("./user.service");
const response_1 = require("../../utils/response");
const errorHandler_1 = require("../../middleware/errorHandler");
const pagination_1 = require("../../utils/pagination");
const ALLOWED_SORT_FIELDS = ['created_at', 'email', 'first_name', 'last_name', 'role'];
const ALLOWED_FILTERS = ['role', 'isActive'];
// Get all users
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = (0, pagination_1.getQueryParams)(req, ALLOWED_SORT_FIELDS, ALLOWED_FILTERS);
    const { users, total } = await user_service_1.userService.getUsers(params);
    const pagination = (0, pagination_1.calculatePaginationMeta)(params.page, params.limit, total);
    (0, response_1.paginatedResponse)(res, users, pagination);
});
// Get user by ID
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await user_service_1.userService.getUserById(req.params.id);
    (0, response_1.successResponse)(res, user);
});
// Update user
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await user_service_1.userService.updateUser(req.params.id, req.user.id, req.user.role, req.body);
    (0, response_1.successResponse)(res, user, 'User updated successfully');
});
// Update user role (admin only)
exports.updateUserRole = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await user_service_1.userService.updateUserRole(req.params.id, req.body.role);
    (0, response_1.successResponse)(res, user, 'User role updated successfully');
});
// Deactivate user (admin only)
exports.deactivateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await user_service_1.userService.deactivateUser(req.params.id);
    (0, response_1.successResponse)(res, null, 'User deactivated successfully');
});
// Activate user (admin only)
exports.activateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await user_service_1.userService.activateUser(req.params.id);
    (0, response_1.successResponse)(res, null, 'User activated successfully');
});
// Delete user (admin only)
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await user_service_1.userService.deleteUser(req.params.id);
    (0, response_1.noContentResponse)(res);
});
//# sourceMappingURL=user.controller.js.map