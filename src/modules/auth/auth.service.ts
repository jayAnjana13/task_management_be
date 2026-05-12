import bcrypt from 'bcryptjs';
import { query } from '../../database';
import { generateTokens, verifyRefreshToken } from '../../middleware/auth';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from '../../utils/errors';
import { RegisterInput, LoginInput } from '../../utils/validation';

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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'isActive'>;
  tokens: AuthTokens;
}

class AuthService {
  // Register a new user
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, role, avatar_url, created_at, updated_at`,
      [data.email, passwordHash, data.firstName, data.lastName]
    );

    const user = this.mapUser(result.rows[0]);

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  // Login user
  async login(data: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, avatar_url, 
              is_active, created_at, updated_at
       FROM users WHERE email = $1`,
      [data.email]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const dbUser = result.rows[0];

    // Check if user is active
    if (!dbUser.is_active) {
      throw new UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, dbUser.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [dbUser.id]
    );

    const user = this.mapUser(dbUser);

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const { userId } = verifyRefreshToken(refreshToken);

    // Get user
    const result = await query(
      `SELECT id, email, role, is_active FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Generate new tokens
    return generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  // Get current user
  async getCurrentUser(userId: string): Promise<Omit<User, 'isActive'>> {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, 
              created_at, updated_at, last_login_at
       FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
    }

    return this.mapUser(result.rows[0]);
  }

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      newPasswordHash,
      userId,
    ]);
  }

  // Map database row to User object
  private mapUser(row: any): Omit<User, 'isActive'> {
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

export const authService = new AuthService();
