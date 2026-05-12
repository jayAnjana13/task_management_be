import { query } from '../../database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { UpdateUserInput } from '../../utils/validation';
import { QueryParams, buildWhereClause, buildSearchClause } from '../../utils/pagination';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResult {
  users: User[];
  total: number;
}

class UserService {
  // Get all users with pagination, filtering, and search
  async getUsers(params: QueryParams): Promise<UserListResult> {
    const { page, limit, offset, sortBy, sortOrder, search, filters } = params;

    // Build filter clause
    const allowedFilterMapping: Record<string, string> = {
      role: 'role',
      isActive: 'is_active',
    };

    const { clause: filterClause, params: filterParams, nextParamIndex } = 
      buildWhereClause(filters, allowedFilterMapping);

    // Build search clause
    const { clause: searchClause, params: searchParams } = buildSearchClause(
      search,
      ['first_name', 'last_name', 'email'],
      nextParamIndex
    );

    const allParams = [...filterParams, ...searchParams];

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE 1=1 ${filterClause} ${searchClause}
    `;
    const countResult = await query(countQuery, allParams);
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
    const usersResult = await query(usersQuery, [...allParams, limit, offset]);

    const users = usersResult.rows.map(this.mapUser);

    return { users, total };
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, 
              is_active, last_login_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return this.mapUser(result.rows[0]);
  }

  // Update user profile
  async updateUser(
    userId: string,
    currentUserId: string,
    currentUserRole: string,
    data: UpdateUserInput
  ): Promise<User> {
    // Check permissions
    if (userId !== currentUserId && currentUserRole !== 'admin') {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
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

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, role, avatar_url, 
                 is_active, last_login_at, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return this.mapUser(result.rows[0]);
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<User> {
    const result = await query(
      `UPDATE users SET role = $1
       WHERE id = $2
       RETURNING id, email, first_name, last_name, role, avatar_url, 
                 is_active, last_login_at, created_at, updated_at`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return this.mapUser(result.rows[0]);
  }

  // Deactivate user (admin only)
  async deactivateUser(userId: string): Promise<void> {
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
  }

  // Activate user (admin only)
  async activateUser(userId: string): Promise<void> {
    const result = await query(
      'UPDATE users SET is_active = true WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<void> {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [
      userId,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
  }

  // Map database row to User object
  private mapUser(row: any): User {
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

export const userService = new UserService();
