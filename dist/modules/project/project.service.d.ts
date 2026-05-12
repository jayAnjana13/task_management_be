import { CreateProjectInput, UpdateProjectInput, AddProjectMemberInput } from '../../utils/validation';
import { QueryParams } from '../../utils/pagination';
export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'archived' | 'completed';
    ownerId: string;
    owner?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    memberCount?: number;
    taskCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: string;
    joinedAt: Date;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
    };
}
export interface ProjectListResult {
    projects: Project[];
    total: number;
}
declare class ProjectService {
    getProjects(userId: string, params: QueryParams): Promise<ProjectListResult>;
    getProjectById(projectId: string, userId: string, userRole?: 'admin' | 'user'): Promise<Project>;
    createProject(userId: string, data: CreateProjectInput): Promise<Project>;
    updateProject(projectId: string, userId: string, data: UpdateProjectInput): Promise<Project>;
    deleteProject(projectId: string, userId: string): Promise<void>;
    getProjectMembers(projectId: string, userId: string): Promise<ProjectMember[]>;
    addMember(projectId: string, userId: string, data: AddProjectMemberInput): Promise<ProjectMember>;
    removeMember(projectId: string, memberId: string, userId: string): Promise<void>;
    userHasAccess(projectId: string, userId: string, userRole?: 'admin' | 'user'): Promise<boolean>;
    isProjectOwner(projectId: string, userId: string): Promise<boolean>;
    getAllProjectsAdmin(params: QueryParams): Promise<ProjectListResult>;
    private mapProjectAdmin;
    private mapProject;
    private mapProjectMember;
}
export declare const projectService: ProjectService;
export {};
//# sourceMappingURL=project.service.d.ts.map