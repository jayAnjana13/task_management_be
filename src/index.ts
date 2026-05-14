import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';

import { config, isAllowedOrigin } from './config';
import { checkDatabaseHealth, checkRedisHealth, closePool, closeRedis } from './database';
import { notFoundHandler, errorHandler, asyncHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Import routes
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/user';
import { projectRoutes } from './modules/project';
import { taskRoutes } from './modules/task';
import { chatRoutes, initializeSocketIO } from './modules/chat';
import { notificationRoutes } from './modules/notification';

// Create Express app
const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Private Network Access (PNA) support for secure origins calling localhost
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network'] === 'true') {
    res.header('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    // Log the rejected origin for debugging
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use(apiRateLimiter);

// API version prefix
const API_PREFIX = `/api/${config.apiVersion}`;

// Health check endpoint
app.get('/health', asyncHandler(async (_req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  const redisHealthy = await checkRedisHealth();

  // Consider healthy if database is connected (Redis is optional)
  const status = dbHealthy ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disabled',
    },
    version: config.apiVersion,
  });
}));

// CORS debug endpoint
app.get('/cors-config', (_req, res) => {
  res.json({
    allowedOrigins: config.corsOrigins,
    nodeEnv: config.nodeEnv,
  });
});

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

// Verify database connection before starting server
const startServer = async () => {
  try {
    console.log('Checking database connection...');
    const dbHealthy = await checkDatabaseHealth();
    
    if (!dbHealthy) {
      console.error('❌ Failed to connect to database. Please check your DATABASE_URL environment variable.');
      console.error('Available config:', {
        hasUrl: !!config.db.url,
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
      });
      process.exit(1);
    }
    
    console.log('✓ Database connection verified');
    
    // Check Redis (optional)
    const redisHealthy = await checkRedisHealth();
    if (redisHealthy) {
      console.log('✓ Redis connection verified');
    } else {
      console.log('⚠ Redis not available - Running without cache');
    }
    
    httpServer.listen(PORT, () => {
      console.log(`
╔═════════════════════════════════════════════════════════════╗
║                                                             ║
║   Task Management API Server                                ║
║                                                             ║
║   Environment: ${config.nodeEnv.padEnd(39)}                 ║
║   Port: ${PORT.toString().padEnd(46)}                       ║
║   API Version: ${config.apiVersion.padEnd(39)}              ║
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n Received ${signal}. Starting graceful shutdown...`);

  httpServer.close(async () => {
    console.log('HTTP server closed');

    try {
      await closePool();
      await closeRedis();
      console.log('All connections closed');
      process.exit(0);
    } catch (error) {
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
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

export { app, httpServer, io };
