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
declare class AuthService {
    register(data: RegisterInput): Promise<AuthResponse>;
    login(data: LoginInput): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    getCurrentUser(userId: string): Promise<Omit<User, 'isActive'>>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    private mapUser;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map