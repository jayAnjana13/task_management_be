"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheKeyGenerators = exports.clearResourceCache = exports.invalidateCache = exports.cacheMiddleware = void 0;
const database_1 = require("../database");
// Cache middleware factory
const cacheMiddleware = (options = {}) => {
    const { ttl = 300, keyPrefix = 'api' } = options;
    return async (req, res, next) => {
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
            : (0, database_1.generateCacheKey)(keyPrefix, cacheKeyParams);
        try {
            // Try to get cached response
            const cachedData = await database_1.cache.get(cacheKey);
            if (cachedData) {
                // Return cached response
                res.setHeader('X-Cache', 'HIT');
                res.json(cachedData);
                return;
            }
            // Store original json method
            const originalJson = res.json.bind(res);
            // Override json method to cache the response
            res.json = (body) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    database_1.cache.set(cacheKey, body, ttl).catch((err) => {
                        console.error('Cache set error:', err);
                    });
                }
                res.setHeader('X-Cache', 'MISS');
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            console.error('Cache middleware error:', error);
            // Proceed without caching if there's an error
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
// Invalidate cache by pattern
const invalidateCache = (pattern) => {
    return async (_req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);
        // Override json method to invalidate cache after response
        res.json = (body) => {
            // Invalidate cache after successful mutation
            if (res.statusCode >= 200 && res.statusCode < 300) {
                database_1.cache.delByPattern(pattern).catch((err) => {
                    console.error('Cache invalidation error:', err);
                });
            }
            return originalJson(body);
        };
        next();
    };
};
exports.invalidateCache = invalidateCache;
// Clear all cache for a resource
const clearResourceCache = async (resourceType, resourceId) => {
    const pattern = resourceId
        ? `*${resourceType}*${resourceId}*`
        : `*${resourceType}*`;
    await database_1.cache.delByPattern(pattern);
};
exports.clearResourceCache = clearResourceCache;
// Cache key generators for common patterns
exports.cacheKeyGenerators = {
    // User-specific cache key
    userSpecific: (prefix) => (req) => {
        return (0, database_1.generateCacheKey)(prefix, {
            userId: req.user?.id || 'anonymous',
            path: req.path,
            query: JSON.stringify(req.query),
        });
    },
    // Project-specific cache key
    projectSpecific: (prefix) => (req) => {
        return (0, database_1.generateCacheKey)(prefix, {
            projectId: req.params.projectId,
            userId: req.user?.id || 'anonymous',
            path: req.path,
            query: JSON.stringify(req.query),
        });
    },
    // Resource-specific cache key
    resourceSpecific: (prefix, paramName) => (req) => {
        return (0, database_1.generateCacheKey)(prefix, {
            resourceId: req.params[paramName],
            userId: req.user?.id || 'anonymous',
        });
    },
};
//# sourceMappingURL=cache.js.map