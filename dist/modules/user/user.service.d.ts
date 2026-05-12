import { UpdateUserInput } from '../../utils/validation';
import { QueryParams } from '../../utils/pagination';
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
declare class UserService {
    getUsers(params: QueryParams): Promise<UserListResult>;
    getUserById(userId: string): Promise<User>;
    updateUser(userId: string, currentUserId: string, currentUserRole: string, data: UpdateUserInput): Promise<User>;
    updateUserRole(userId: string, role: 'admin' | 'user'): Promise<User>;
    deactivateUser(userId: string): Promise<void>;
    activateUser(userId: string): Promise<void>;
    deleteUser(userId: string): Promise<void>;
    private mapUser;
}
export declare const userService: UserService;
export {};
//# sourceMappingURL=user.service.d.ts.map