"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const database_1 = require("../../database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
class UserService {
    // Get all users with pagination, filtering, and search
    async getUsers(params) {
        const { page, limit, offset, sortBy, sortOrder, search, filters } = params;
        // Build filter clause
        const allowedFilterMapping = {
            role: 'role',
            isActive: 'is_active',
        };
        const { clause: filterClause, params: filterParams, nextParamIndex } = (0, pagination_1.buildWhereClause)(filters, allowedFilterMapping);
        // Build search clause
        const { clause: searchClause, params: searchParams } = (0, pagination_1.buildSearchClause)(search, ['first_name', 'last_name', 'email'], nextParamIndex);
        const allParams = [...filterParams, ...searchParams];
        // Get total count
        const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE 1=1 ${filterClause} ${searchClause}
    `;
        const countResult = await (0, database_1.query)(countQuery, allParams);
        const total = parseInt(countResult.rows[0].total, 10);
        // Get users
        const usersQuery = `
      SELECT id, email, first_name, last_name, role, avatar_url, 
             is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE 1=1 ${filterClause} ${searchClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${allParams.length + 1} OFFSET $${allParams.length + 2}
    `;
        const usersResult = await (0, database_1.query)(usersQuery, [...allParams, limit, offset]);
        const users = usersResult.rows.map(this.mapUser);
        return { users, total };
    }
    // Get user by ID
    async getUserById(userId) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name, last_name, role, avatar_url, 
              is_active, last_login_at, created_at, updated_at
       FROM users WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        return this.mapUser(result.rows[0]);
    }
    // Update user profile
    async updateUser(userId, currentUserId, currentUserRole, data) {
        // Check permissions
        if (userId !== currentUserId && currentUserRole !== 'admin') {
            throw new errors_1.ForbiddenError('You can only update your own profile');
        }
        // Build update query
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (data.firstName !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            params.push(data.firstName);
        }
        if (data.lastName !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            params.push(data.lastName);
        }
        if (data.avatarUrl !== undefined) {
            updates.push(`avatar_url = $${paramIndex++}`);
            params.push(data.avatarUrl);
        }
        if (updates.length === 0) {
            return this.getUserById(userId);
        }
        params.push(userId);
        const result = await (0, database_1.query)(`UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, role, avatar_url, 
                 is_active, last_login_at, created_at, updated_at`, params);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        return this.mapUser(result.rows[0]);
    }
    // Update user role (admin only)
    async updateUserRole(userId, role) {
        const result = await (0, database_1.query)(`UPDATE users SET role = $1
       WHERE id = $2
       RETURNING id, email, first_name, last_name, role, avatar_url, 
                 is_active, last_login_at, created_at, updated_at`, [role, userId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        return this.mapUser(result.rows[0]);
    }
    // Deactivate user (admin only)
    async deactivateUser(userId) {
        const result = await (0, database_1.query)('UPDATE users SET is_active = false WHERE id = $1 RETURNING id', [userId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
    }
    // Activate user (admin only)
    async activateUser(userId) {
        const result = await (0, database_1.query)('UPDATE users SET is_active = true WHERE id = $1 RETURNING id', [userId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
    }
    // Delete user (admin only)
    async deleteUser(userId) {
        const result = await (0, database_1.query)('DELETE FROM users WHERE id = $1 RETURNING id', [
            userId,
        ]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
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
            isActive: row.is_active,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map