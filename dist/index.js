"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const config_1 = require("./config");
const database_1 = require("./database");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
// Import routes
const auth_1 = require("./modules/auth");
const user_1 = require("./modules/user");
const project_1 = require("./modules/project");
const task_1 = require("./modules/task");
const chat_1 = require("./modules/chat");
const notification_1 = require("./modules/notification");
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Initialize Socket.IO
const io = (0, chat_1.initializeSocketIO)(httpServer);
exports.io = io;
// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Global rate limiting
app.use(rateLimiter_1.apiRateLimiter);
// API version prefix
const API_PREFIX = `/api/${config_1.config.apiVersion}`;
// Health check endpoint
app.get('/health', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const dbHealthy = await (0, database_1.checkDatabaseHealth)();
    const redisHealthy = await (0, database_1.checkRedisHealth)();
    const status = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
    const statusCode = status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
        status,
        timestamp: new Date().toISOString(),
        services: {
            database: dbHealthy ? 'connected' : 'disconnected',
            redis: redisHealthy ? 'connected' : 'disconnected',
        },
        version: config_1.config.apiVersion,
    });
}));
// API routes
app.use(`${API_PREFIX}/auth`, auth_1.authRoutes);
app.use(`${API_PREFIX}/users`, user_1.userRoutes);
app.use(`${API_PREFIX}/projects`, project_1.projectRoutes);
app.use(`${API_PREFIX}/tasks`, task_1.taskRoutes);
app.use(`${API_PREFIX}/chat`, chat_1.chatRoutes);
app.use(`${API_PREFIX}/notifications`, notification_1.notificationRoutes);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Global error handler
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = config_1.config.port;
httpServer.listen(PORT, () => {
    console.log(`
╔═════════════════════════════════════════════════════════════╗
║                                                             ║
║   Task Management API Server                                ║
║                                                             ║
║   Environment: ${config_1.config.nodeEnv.padEnd(39)}                 ║
║   Port: ${PORT.toString().padEnd(46)}                       ║
║   API Version: ${config_1.config.apiVersion.padEnd(39)}              ║
║   API URL: http://localhost:${PORT}${API_PREFIX.padEnd(17)} ║
║                                                             ║
║   Endpoints:                                                ║
║   - Auth:     ${API_PREFIX}/auth                            ║
║   - Users:    ${API_PREFIX}/users                           ║
║   - Projects: ${API_PREFIX}/projects                        ║
║   - Tasks:    ${API_PREFIX}/tasks                           ║
║   - Chat:     ${API_PREFIX}/chat                            ║
║   - Notifications: ${API_PREFIX}/notifications              ║
║                                                             ║
║   WebSocket: ws://localhost:${PORT}                         ║
║                                                             ║
╚═════════════════════════════════════════════════════════════╝
  `);
});
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n Received ${signal}. Starting graceful shutdown...`);
    httpServer.close(async () => {
        console.log('HTTP server closed');
        try {
            await (0, database_1.closePool)();
            await (0, database_1.closeRedis)();
            console.log('All connections closed');
            process.exit(0);
        }
        catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    gracefulShutdown('unhandledRejection');
});
//# sourceMappingURL=index.js.map