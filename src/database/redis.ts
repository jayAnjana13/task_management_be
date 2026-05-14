import Redis from 'ioredis';
import { config } from '../config';

// Determine if Redis should be enabled
// Only enable in development with localhost, or in production with explicit Redis host
const isRedisEnabled = 
  (config.nodeEnv === 'development' && config.redis.host === 'localhost') ||
  (config.nodeEnv === 'production' && config.redis.host && config.redis.host !== 'localhost');

// Create Redis client only if enabled
let redis: Redis | null = null;

if (isRedisEnabled) {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.error('Redis connection failed after 3 retries. Running without cache.');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
  });

  redis.on('connect', () => {
    console.log('✓ Redis connected');
  });

  redis.on('error', (err: Error) => {
    console.warn('Redis error:', err.message, '- Running without cache');
  });

  redis.on('close', () => {
    console.log('Redis connection closed');
  });

  // Try to connect
  redis.connect().catch((err) => {
    console.warn('Redis connection failed:', err.message, '- Running without cache');
    redis = null;
  });
} else {
  console.log('⚠ Redis disabled - Running without cache (using localhost in production)');
}

// Cache helper functions
export const cache = {
  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Set cache with expiration (default 5 minutes)
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!redis) return;
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Delete cache
  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  // Delete cache by pattern
  async delByPattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete by pattern error:', error);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  // Get TTL for a key
  async ttl(key: string): Promise<number> {
    if (!redis) return -1;
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -1;
    }
  },

  // Flush all cache (use with caution)
  async flush(): Promise<void> {
    if (!redis) return;
    try {
      await redis.flushdb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  },
};

// Generate cache key
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join(':');
  return `${prefix}:${sortedParams}`;
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  if (!redis) return false;
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
  if (!redis) return;
  try {
    await redis.quit();
    console.log('Redis connection closed');
  } catch (error) {
    console.warn('Error closing Redis:', error);
  }
}

export { redis };
