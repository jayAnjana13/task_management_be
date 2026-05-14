import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  apiVersion: process.env.API_VERSION || "v1",

  // Database
  db: {
    url: process.env.DATABASE_URL || undefined,
    ssl: (process.env.DB_SSL === 'true') || (process.env.DATABASE_URL?.includes('sslmode=require') ?? false),
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "default_secret_change_me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN,

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || "10", 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || "100", 10),
  },
} as const;

export type Config = typeof config;
