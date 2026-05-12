import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { config } from "../config";
import { redis } from "../database";

// Custom Redis store for rate limiting
class RedisStore {
  private prefix: string;
  private windowMs: number;

  constructor(options: { prefix?: string; windowMs: number }) {
    this.prefix = options.prefix || "rl:";
    this.windowMs = options.windowMs;
  }

  async increment(
    key: string,
  ): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}${key}`;

    try {
      const multi = redis.multi();
      multi.incr(redisKey);
      multi.pttl(redisKey);

      const results = await multi.exec();

      if (!results) {
        return {
          totalHits: 1,
          resetTime: new Date(Date.now() + this.windowMs),
        };
      }

      const totalHits = results[0][1] as number;
      let ttl = results[1][1] as number;

      // If key is new, set expiration
      if (ttl === -1 || ttl === -2) {
        await redis.pexpire(redisKey, this.windowMs);
        ttl = this.windowMs;
      }

      return {
        totalHits,
        resetTime: new Date(Date.now() + ttl),
      };
    } catch (error) {
      console.error("Rate limit store error:", error);
      // Fail open - allow request if Redis fails
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      await redis.decr(`${this.prefix}${key}`);
    } catch (error) {
      console.error("Rate limit decrement error:", error);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await redis.del(`${this.prefix}${key}`);
    } catch (error) {
      console.error("Rate limit reset error:", error);
    }
  }
}

// Key generator
const keyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise IP
  const userId = req.user?.id;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return userId || ip;
};

// Rate limit exceeded handler
const rateLimitHandler = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    },
  });
};

// Standard rate limiter
export const standardRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // 100 requests per window
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
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  keyGenerator: (req: Request) => req.ip || "unknown",
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message:
          "Too many authentication attempts. Please try again in 15 minutes.",
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
export const readRateLimiter = rateLimit({
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
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute overall
  keyGenerator: (req: Request) => req.ip || "unknown",
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  // store: new RedisStore({
  //   prefix: "rl:api:",
  //   windowMs: 60 * 1000,
  // }),
});
