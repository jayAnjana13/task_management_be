"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectService = void 0;
const database_1 = require("../../database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const notification_1 = require("../notification");
class ProjectService {
    // Get all projects for a user (owned or member)
    async getProjects(userId, params) {
        const { page, limit, offset, sortBy, sortOrder, search, filters } = params;
        // Build filter clause
        const allowedFilterMapping = {
            status: 'p.status',
        };
        const { clause: filterClause, params: filterParams, nextParamIndex } = (0, pagination_1.buildWhereClause)(filters, allowedFilterMapping, 2);
        // Build search clause
        const { clause: searchClause, params: searchParams } = (0, pagination_1.buildSearchClause)(search, ['p.name', 'p.description'], nextParamIndex);
        const allParams = [userId, ...filterParams, ...searchParams];
        // Get total count
        const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
      ${filterClause} ${searchClause}
    `;
        const countResult = await (0, database_1.query)(countQuery, allParams);
        const total = parseInt(countResult.rows[0].total, 10);
        // Get projects with counts
        const projectsQuery = `
      SELECT p.id, p.name, p.description, p.status, p.owner_id, 
             p.created_at, p.updated_at,
             u.id as owner_id, u.first_name as owner_first_name, 
             u.last_name as owner_last_name, u.email as owner_email,
             (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
      ${filterClause} ${searchClause}
      GROUP BY p.id, u.id
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT $${allParams.length + 1} OFFSET $${allParams.length + 2}
    `;
        const projectsResult = await (0, database_1.query)(projectsQuery, [...allParams, limit, offset]);
        const projects = projectsResult.rows.map(this.mapProject);
        return { projects, total };
    }
    // Get project by ID
    async getProjectById(projectId, userId, userRole) {
        const result = await (0, database_1.query)(`SELECT p.id, p.name, p.description, p.status, p.owner_id, 
              p.created_at, p.updated_at,
              u.id as owner_id, u.first_name as owner_first_name, 
              u.last_name as owner_last_name, u.email as owner_email,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`, [projectId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('Project not found');
        }
        // Check if user has access (admin always has access)
        const hasAccess = await this.userHasAccess(projectId, userId, userRole);
        if (!hasAccess) {
            throw new errors_1.ForbiddenError('You do not have access to this project');
        }
        return this.mapProject(result.rows[0]);
    }
    // Create new project
    async createProject(userId, data) {
        return (0, database_1.withTransaction)(async (client) => {
            // Create project
            const projectResult = await client.query(`INSERT INTO projects (name, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, status, owner_id, created_at, updated_at`, [data.name, data.description, userId]);
            const project = projectResult.rows[0];
            // Add owner as member with 'owner' role
            await client.query(`INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'owner')`, [project.id, userId]);
            // Get full project details
            const fullProjectResult = await client.query(`SELECT p.id, p.name, p.description, p.status, p.owner_id, 
                p.created_at, p.updated_at,
                u.id as owner_id, u.first_name as owner_first_name, 
                u.last_name as owner_last_name, u.email as owner_email
         FROM projects p
         LEFT JOIN users u ON p.owner_id = u.id
         WHERE p.id = $1`, [project.id]);
            return this.mapProject({ ...fullProjectResult.rows[0], member_count: 1, task_count: 0 });
        });
    }
    // Update project
    async updateProject(projectId, userId, data) {
        // Check ownership
        const isOwner = await this.isProjectOwner(projectId, userId);
        if (!isOwner) {
            throw new errors_1.ForbiddenError('Only the project owner can update the project');
        }
        // Build update query
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (data.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(data.name);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(data.description);
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            params.push(data.status);
        }
        if (updates.length === 0) {
            return this.getProjectById(projectId, userId);
        }
        params.push(projectId);
        const result = await (0, database_1.query)(`UPDATE projects SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, description, status, owner_id, created_at, updated_at`, params);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('Project not found');
        }
        return this.getProjectById(projectId, userId);
    }
    // Delete project
    async deleteProject(projectId, userId) {
        // Check ownership
        const isOwner = await this.isProjectOwner(projectId, userId);
        if (!isOwner) {
            throw new errors_1.ForbiddenError('Only the project owner can delete the project');
        }
        const result = await (0, database_1.query)('DELETE FROM projects WHERE id = $1 RETURNING id', [
            projectId,
        ]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('Project not found');
        }
    }
    // Get project members
    async getProjectMembers(projectId, userId) {
        // Check access
        const hasAccess = await this.userHasAccess(projectId, userId);
        if (!hasAccess) {
            throw new errors_1.ForbiddenError('You do not have access to this project');
        }
        const result = await (0, database_1.query)(`SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.joined_at,
              u.id as user_id, u.first_name, u.last_name, u.email, u.avatar_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`, [projectId]);
        return result.rows.map(this.mapProjectMember);
    }
    // Add member to project
    async addMember(projectId, userId, data) {
        // Check ownership
        const isOwner = await this.isProjectOwner(projectId, userId);
        if (!isOwner) {
            throw new errors_1.ForbiddenError('Only the project owner can add members');
        }
        // Check if user exists
        const userResult = await (0, database_1.query)('SELECT id FROM users WHERE id = $1', [data.userId]);
        if (userResult.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        const [projectResult, ownerResult] = await Promise.all([
            (0, database_1.query)('SELECT name FROM projects WHERE id = $1', [projectId]),
            (0, database_1.query)('SELECT first_name, last_name FROM users WHERE id = $1', [userId]),
        ]);
        // Add member
        const result = await (0, database_1.query)(`INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
       RETURNING id, project_id, user_id, role, joined_at`, [projectId, data.userId, data.role]);
        // Get full member details
        const memberResult = await (0, database_1.query)(`SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.joined_at,
              u.id as user_id, u.first_name, u.last_name, u.email, u.avatar_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.id = $1`, [result.rows[0].id]);
        const member = this.mapProjectMember(memberResult.rows[0]);
        if (data.userId !== userId) {
            const ownerName = ownerResult.rows[0]
                ? `${ownerResult.rows[0].first_name} ${ownerResult.rows[0].last_name}`.trim()
                : 'Project owner';
            const projectName = projectResult.rows[0]?.name || 'a project';
            await notification_1.notificationService.createNotification({
                userId: data.userId,
                type: 'project_member_added',
                title: 'Added to project',
                message: `${ownerName} added you to ${projectName}.`,
                metadata: { projectId },
            });
        }
        return member;
    }
    // Remove member from project
    async removeMember(projectId, memberId, userId) {
        // Check ownership
        const isOwner = await this.isProjectOwner(projectId, userId);
        if (!isOwner) {
            throw new errors_1.ForbiddenError('Only the project owner can remove members');
        }
        // Get member to check if it's the owner
        const memberResult = await (0, database_1.query)(`SELECT pm.user_id, p.owner_id
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.id = $1 AND pm.project_id = $2`, [memberId, projectId]);
        if (memberResult.rows.length === 0) {
            throw new errors_1.NotFoundError('Member not found');
        }
        if (memberResult.rows[0].user_id === memberResult.rows[0].owner_id) {
            throw new errors_1.ForbiddenError('Cannot remove the project owner');
        }
        await (0, database_1.query)('DELETE FROM project_members WHERE id = $1', [memberId]);
    }
    // Helper: Check if user has access to project (admin always has access)
    async userHasAccess(projectId, userId, userRole) {
        // Admin has access to all projects
        if (userRole === 'admin') {
            const exists = await (0, database_1.query)('SELECT 1 FROM projects WHERE id = $1', [projectId]);
            return exists.rows.length > 0;
        }
        const result = await (0, database_1.query)(`SELECT 1 FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
       LIMIT 1`, [projectId, userId]);
        return result.rows.length > 0;
    }
    // Helper: Check if user is project owner
    async isProjectOwner(projectId, userId) {
        const result = await (0, database_1.query)('SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2', [projectId, userId]);
        return result.rows.length > 0;
    }
    // Admin: Get ALL projects in the system
    async getAllProjectsAdmin(params) {
        const { page, limit, offset, sortBy, sortOrder, search, filters } = params;
        // Build filter clause
        const allowedFilterMapping = {
            status: 'p.status',
        };
        const { clause: filterClause, params: filterParams, nextParamIndex } = (0, pagination_1.buildWhereClause)(filters, allowedFilterMapping, 1);
        // Build search clause
        const { clause: searchClause, params: searchParams } = (0, pagination_1.buildSearchClause)(search, ['p.name', 'p.description'], nextParamIndex);
        const allParams = [...filterParams, ...searchParams];
        // Get total count
        const countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      WHERE 1=1 ${filterClause} ${searchClause}
    `;
        const countResult = await (0, database_1.query)(countQuery, allParams);
        const total = parseInt(countResult.rows[0].total, 10);
        // Get all projects with counts
        const projectsQuery = `
      SELECT p.id, p.name, p.description, p.status, p.owner_id, 
             p.created_at, p.updated_at,
             u.id as owner_id, u.first_name as owner_first_name, 
             u.last_name as owner_last_name, u.email as owner_email,
             (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
             (SELECT COUNT(*) FROM messages WHERE project_id = p.id) as message_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE 1=1 ${filterClause} ${searchClause}
      GROUP BY p.id, u.id
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT $${allParams.length + 1} OFFSET $${allParams.length + 2}
    `;
        const projectsResult = await (0, database_1.query)(projectsQuery, [...allParams, limit, offset]);
        const projects = projectsResult.rows.map(this.mapProjectAdmin);
        return { projects, total };
    }
    // Map with message count for admin
    mapProjectAdmin(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            ownerId: row.owner_id,
            owner: row.owner_first_name ? {
                id: row.owner_id,
                firstName: row.owner_first_name,
                lastName: row.owner_last_name,
                email: row.owner_email,
            } : undefined,
            memberCount: row.member_count ? parseInt(row.member_count, 10) : undefined,
            taskCount: row.task_count ? parseInt(row.task_count, 10) : undefined,
            messageCount: row.message_count ? parseInt(row.message_count, 10) : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    // Map database row to Project object
    mapProject(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            ownerId: row.owner_id,
            owner: row.owner_first_name ? {
                id: row.owner_id,
                firstName: row.owner_first_name,
                lastName: row.owner_last_name,
                email: row.owner_email,
            } : undefined,
            memberCount: row.member_count ? parseInt(row.member_count, 10) : undefined,
            taskCount: row.task_count ? parseInt(row.task_count, 10) : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    // Map database row to ProjectMember object
    mapProjectMember(row) {
        return {
            id: row.id,
            projectId: row.project_id,
            userId: row.user_id,
            role: row.role,
            joinedAt: row.joined_at,
            user: {
                id: row.user_id,
                firstName: row.first_name,
                lastName: row.last_name,
                email: row.email,
                avatarUrl: row.avatar_url,
            },
        };
    }
}
exports.projectService = new ProjectService();
//# sourceMappingURL=project.service.js.map