"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.readRateLimiter = exports.authRateLimiter = exports.standardRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
const database_1 = require("../database");
// Custom Redis store for rate limiting
class RedisStore {
    prefix;
    windowMs;
    constructor(options) {
        this.prefix = options.prefix || "rl:";
        this.windowMs = options.windowMs;
    }
    async increment(key) {
        const redisKey = `${this.prefix}${key}`;
        try {
            const multi = database_1.redis.multi();
            multi.incr(redisKey);
            multi.pttl(redisKey);
            const results = await multi.exec();
            if (!results) {
                return {
                    totalHits: 1,
                    resetTime: new Date(Date.now() + this.windowMs),
                };
            }
            const totalHits = results[0][1];
            let ttl = results[1][1];
            // If key is new, set expiration
            if (ttl === -1 || ttl === -2) {
                await database_1.redis.pexpire(redisKey, this.windowMs);
                ttl = this.windowMs;
            }
            return {
                totalHits,
                resetTime: new Date(Date.now() + ttl),
            };
        }
        catch (error) {
            console.error("Rate limit store error:", error);
            // Fail open - allow request if Redis fails
            return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
        }
    }
    async decrement(key) {
        try {
            await database_1.redis.decr(`${this.prefix}${key}`);
        }
        catch (error) {
            console.error("Rate limit decrement error:", error);
        }
    }
    async resetKey(key) {
        try {
            await database_1.redis.del(`${this.prefix}${key}`);
        }
        catch (error) {
            console.error("Rate limit reset error:", error);
        }
    }
}
// Key generator
const keyGenerator = (req) => {
    // Use user ID if authenticated, otherwise IP
    const userId = req.user?.id;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return userId || ip;
};
// Rate limit exceeded handler
const rateLimitHandler = (_req, res) => {
    res.status(429).json({
        success: false,
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
        },
    });
};
// Standard rate limiter
exports.standardRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs, // 15 minutes
    max: config_1.config.rateLimit.maxRequests, // 100 requests per window
    keyGenerator,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({
    //   prefix: 'rl:standard:',
    //   windowMs: config.rateLimit.windowMs,
    // }),
});
// Strict rate limiter for auth endpoints
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    keyGenerator: (req) => req.ip || "unknown",
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                code: "AUTH_RATE_LIMIT_EXCEEDED",
                message: "Too many authentication attempts. Please try again in 15 minutes.",
            },
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({
    //   prefix: "rl:auth:",
    //   windowMs: 15 * 60 * 1000,
    // }),
});
// Relaxed rate limiter for read-heavy endpoints
exports.readRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    keyGenerator,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({
    //   prefix: "rl:read:",
    //   windowMs: 60 * 1000,
    // }),
});
// API-wide rate limiter (overall limit)
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute overall
    keyGenerator: (req) => req.ip || "unknown",
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({
    //   prefix: "rl:api:",
    //   windowMs: 60 * 1000,
    // }),
});
//# sourceMappingURL=rateLimiter.js.map