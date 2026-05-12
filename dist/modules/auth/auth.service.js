"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../database");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../utils/errors");
class AuthService {
    // Register a new user
    async register(data) {
        // Check if email already exists
        const existingUser = await (0, database_1.query)('SELECT id FROM users WHERE email = $1', [data.email]);
        if (existingUser.rows.length > 0) {
            throw new errors_1.ConflictError('Email already registered', 'EMAIL_EXISTS');
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        // Create user
        const result = await (0, database_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, role, avatar_url, created_at, updated_at`, [data.email, passwordHash, data.firstName, data.lastName]);
        const user = this.mapUser(result.rows[0]);
        // Generate tokens
        const tokens = (0, auth_1.generateTokens)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return { user, tokens };
    }
    // Login user
    async login(data) {
        // Find user by email
        const result = await (0, database_1.query)(`SELECT id, email, password_hash, first_name, last_name, role, avatar_url, 
              is_active, created_at, updated_at
       FROM users WHERE email = $1`, [data.email]);
        if (result.rows.length === 0) {
            throw new errors_1.UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        const dbUser = result.rows[0];
        // Check if user is active
        if (!dbUser.is_active) {
            throw new errors_1.UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(data.password, dbUser.password_hash);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        // Update last login
        await (0, database_1.query)('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [dbUser.id]);
        const user = this.mapUser(dbUser);
        // Generate tokens
        const tokens = (0, auth_1.generateTokens)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return { user, tokens };
    }
    // Refresh access token
    async refreshToken(refreshToken) {
        // Verify refresh token
        const { userId } = (0, auth_1.verifyRefreshToken)(refreshToken);
        // Get user
        const result = await (0, database_1.query)(`SELECT id, email, role, is_active FROM users WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            throw new errors_1.UnauthorizedError('User not found', 'USER_NOT_FOUND');
        }
        const user = result.rows[0];
        if (!user.is_active) {
            throw new errors_1.UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
        }
        // Generate new tokens
        return (0, auth_1.generateTokens)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
    }
    // Get current user
    async getCurrentUser(userId) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name, last_name, role, avatar_url, 
              created_at, updated_at, last_login_at
       FROM users WHERE id = $1 AND is_active = true`, [userId]);
        if (result.rows.length === 0) {
            throw new errors_1.UnauthorizedError('User not found', 'USER_NOT_FOUND');
        }
        return this.mapUser(result.rows[0]);
    }
    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        // Get current password hash
        const result = await (0, database_1.query)('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new errors_1.UnauthorizedError('User not found', 'USER_NOT_FOUND');
        }
        // Verify current password
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, result.rows[0].password_hash);
        if (!isPasswordValid) {
            throw new errors_1.BadRequestError('Current password is incorrect', 'INVALID_PASSWORD');
        }
        // Hash new password
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 12);
        // Update password
        await (0, database_1.query)('UPDATE users SET password_hash = $1 WHERE id = $2', [
            newPasswordHash,
            userId,
        ]);
    }
    // Map database row to User object
    mapUser(row) {
        return {
            id: row.id,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
            avatarUrl: row.avatar_url,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map