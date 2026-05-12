import { Request, Response, NextFunction } from 'express';
import { cache, generateCacheKey } from '../database';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}

// Cache middleware factory
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { ttl = 300, keyPrefix = 'api' } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKeyParams = {
      path: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      ...(Object.keys(req.query).length > 0 && { query: JSON.stringify(req.query) }),
    };

    const cacheKey = options.keyGenerator
      ? options.keyGenerator(req)
      : generateCacheKey(keyPrefix, cacheKeyParams);

    try {
      // Try to get cached response
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        // Return cached response
        res.setHeader('X-Cache', 'HIT');
        res.json(cachedData);
        return;
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = (body: any): Response => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, body, ttl).catch((err) => {
            console.error('Cache set error:', err);
          });
        }

        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Proceed without caching if there's an error
      next();
    }
  };
};

// Invalidate cache by pattern
export const invalidateCache = (pattern: string) => {
  return async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after response
    res.json = (body: any): Response => {
      // Invalidate cache after successful mutation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.delByPattern(pattern).catch((err) => {
          console.error('Cache invalidation error:', err);
        });
      }

      return originalJson(body);
    };

    next();
  };
};

// Clear all cache for a resource
export const clearResourceCache = async (resourceType: string, resourceId?: string): Promise<void> => {
  const pattern = resourceId
    ? `*${resourceType}*${resourceId}*`
    : `*${resourceType}*`;
  
  await cache.delByPattern(pattern);
};

// Cache key generators for common patterns
export const cacheKeyGenerators = {
  // User-specific cache key
  userSpecific: (prefix: string) => (req: Request): string => {
    return generateCacheKey(prefix, {
      userId: req.user?.id || 'anonymous',
      path: req.path,
      query: JSON.stringify(req.query),
    });
  },

  // Project-specific cache key
  projectSpecific: (prefix: string) => (req: Request): string => {
    return generateCacheKey(prefix, {
      projectId: req.params.projectId,
      userId: req.user?.id || 'anonymous',
      path: req.path,
      query: JSON.stringify(req.query),
    });
  },

  // Resource-specific cache key
  resourceSpecific: (prefix: string, paramName: string) => (req: Request): string => {
    return generateCacheKey(prefix, {
      resourceId: req.params[paramName],
      userId: req.user?.id || 'anonymous',
    });
  },
};
