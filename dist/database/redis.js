"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.cache = void 0;
exports.generateCacheKey = generateCacheKey;
exports.checkRedisHealth = checkRedisHealth;
exports.closeRedis = closeRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
// Create Redis client
const redis = new ioredis_1.default({
    host: config_1.config.redis.host,
    port: config_1.config.redis.port,
    password: config_1.config.redis.password || undefined,
    retryStrategy: (times) => {
        if (times > 3) {
            console.error('Redis connection failed after 3 retries');
            return null;
        }
        return Math.min(times * 200, 2000);
    },
    maxRetriesPerRequest: 3,
});
exports.redis = redis;
redis.on('connect', () => {
    console.log('Redis connected');
});
redis.on('error', (err) => {
    console.error('Redis error:', err.message);
});
redis.on('close', () => {
    console.log('Redis connection closed');
});
// Cache helper functions
exports.cache = {
    // Get cached value
    async get(key) {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },
    // Set cache with expiration (default 5 minutes)
    async set(key, value, ttlSeconds = 300) {
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    },
    // Delete cache
    async del(key) {
        try {
            await redis.del(key);
        }
        catch (error) {
            console.error('Cache delete error:', error);
        }
    },
    // Delete cache by pattern
    async delByPattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
        catch (error) {
            console.error('Cache delete by pattern error:', error);
        }
    },
    // Check if key exists
    async exists(key) {
        try {
            return (await redis.exists(key)) === 1;
        }
        catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    },
    // Get TTL for a key
    async ttl(key) {
        try {
            return await redis.ttl(key);
        }
        catch (error) {
            console.error('Cache ttl error:', error);
            return -1;
        }
    },
    // Flush all cache (use with caution)
    async flush() {
        try {
            await redis.flushdb();
        }
        catch (error) {
            console.error('Cache flush error:', error);
        }
    },
};
// Generate cache key
function generateCacheKey(prefix, params) {
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}:${params[key]}`)
        .join(':');
    return `${prefix}:${sortedParams}`;
}
// Health check
async function checkRedisHealth() {
    try {
        const pong = await redis.ping();
        return pong === 'PONG';
    }
    catch {
        return false;
    }
}
// Close Redis connection
async function closeRedis() {
    await redis.quit();
    console.log('Redis connection closed');
}
//# sourceMappingURL=redis.js.map