"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = require("./connection");
async function seed() {
    console.log('Starting database seeding...');
    try {
        // Create admin user
        const adminPasswordHash = await bcryptjs_1.default.hash('Admin123!', 12);
        const adminResult = await (0, connection_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2
       RETURNING id`, ['admin@taskmanager.com', adminPasswordHash, 'Admin', 'User', 'admin']);
        const adminId = adminResult.rows[0].id;
        console.log('Admin user created:', adminId);
        // Create regular users
        const userPasswordHash = await bcryptjs_1.default.hash('User123!', 12);
        const users = [
            ['john.doe@example.com', 'John', 'Doe'],
            ['jane.smith@example.com', 'Jane', 'Smith'],
            ['bob.wilson@example.com', 'Bob', 'Wilson'],
        ];
        const userIds = [];
        for (const [email, firstName, lastName] of users) {
            const result = await (0, connection_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, 'user')
         ON CONFLICT (email) DO UPDATE SET first_name = $3
         RETURNING id`, [email, userPasswordHash, firstName, lastName]);
            userIds.push(result.rows[0].id);
        }
        console.log('Regular users created:', userIds.length);
        // Create sample projects
        const projects = [
            ['E-Commerce Platform', 'Building a modern e-commerce platform with React and Node.js'],
            ['Mobile App Development', 'Cross-platform mobile app using React Native'],
            ['Data Analytics Dashboard', 'Real-time analytics dashboard with charts and reports'],
        ];
        const projectIds = [];
        for (const [name, description] of projects) {
            const result = await (0, connection_1.query)(`INSERT INTO projects (name, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING id`, [name, description, adminId]);
            projectIds.push(result.rows[0].id);
        }
        console.log('Projects created:', projectIds.length);
        // Add members to projects
        for (const projectId of projectIds) {
            // Add admin as owner
            await (0, connection_1.query)(`INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (project_id, user_id) DO NOTHING`, [projectId, adminId]);
            // Add some users as members
            for (let i = 0; i < userIds.length; i++) {
                await (0, connection_1.query)(`INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (project_id, user_id) DO NOTHING`, [projectId, userIds[i], i === 0 ? 'lead' : 'member']);
            }
        }
        console.log('Project members added');
        // Create sample tasks
        const taskStatuses = ['todo', 'in_progress', 'review', 'done'];
        const taskPriorities = ['low', 'medium', 'high', 'urgent'];
        const sampleTasks = [
            'Setup development environment',
            'Design database schema',
            'Create API endpoints',
            'Implement authentication',
            'Build user interface',
            'Write unit tests',
            'Setup CI/CD pipeline',
            'Deploy to staging',
            'Performance optimization',
            'Documentation',
        ];
        let taskPosition = 0;
        for (const projectId of projectIds) {
            for (const taskTitle of sampleTasks) {
                const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
                const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
                const assigneeId = Math.random() > 0.3 ? userIds[Math.floor(Math.random() * userIds.length)] : null;
                await (0, connection_1.query)(`INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, reporter_id, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                    taskTitle,
                    `Description for ${taskTitle}`,
                    status,
                    priority,
                    projectId,
                    assigneeId,
                    adminId,
                    taskPosition++,
                ]);
            }
        }
        console.log('Tasks created');
        // Create sample messages
        const sampleMessages = [
            'Hey team, let\'s discuss the project timeline.',
            'I\'ve completed the initial setup. Ready for review.',
            'Great progress everyone! Keep it up.',
            'Does anyone need help with their tasks?',
            'Meeting scheduled for tomorrow at 10 AM.',
        ];
        for (const projectId of projectIds) {
            for (const content of sampleMessages) {
                const userId = [adminId, ...userIds][Math.floor(Math.random() * (userIds.length + 1))];
                await (0, connection_1.query)(`INSERT INTO messages (content, project_id, user_id)
           VALUES ($1, $2, $3)`, [content, projectId, userId]);
            }
        }
        console.log('Messages created');
        console.log('Database seeding completed successfully!');
        console.log('\nTest credentials:');
        console.log('  Admin: admin@taskmanager.com / Admin123!');
        console.log('  User:  john.doe@example.com / User123!');
    }
    catch (error) {
        console.error('Seeding failed:', error);
        throw error;
    }
    finally {
        await (0, connection_1.closePool)();
    }
}
// Run seed if this file is executed directly
seed().catch(() => process.exit(1));
//# sourceMappingURL=seed.js.map