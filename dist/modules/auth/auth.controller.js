"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.changePassword = exports.getCurrentUser = exports.refreshToken = exports.login = exports.register = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../utils/response");
const errorHandler_1 = require("../../middleware/errorHandler");
// Register new user
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const result = await auth_service_1.authService.register(data);
    (0, response_1.createdResponse)(res, result, 'Registration successful');
});
// Login user
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const result = await auth_service_1.authService.login(data);
    (0, response_1.successResponse)(res, result, 'Login successful');
});
// Refresh token
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await auth_service_1.authService.refreshToken(refreshToken);
    (0, response_1.successResponse)(res, tokens, 'Token refreshed successfully');
});
// Get current user
exports.getCurrentUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await auth_service_1.authService.getCurrentUser(req.user.id);
    (0, response_1.successResponse)(res, user);
});
// Change password
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await auth_service_1.authService.changePassword(req.user.id, currentPassword, newPassword);
    (0, response_1.successResponse)(res, null, 'Password changed successfully');
});
// Logout (client-side token removal, server-side just returns success)
exports.logout = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    // In a production app, you might want to:
    // - Add the token to a blacklist
    // - Invalidate refresh tokens in the database
    (0, response_1.successResponse)(res, null, 'Logout successful');
});
//# sourceMappingURL=auth.controller.js.map