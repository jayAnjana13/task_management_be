import { Request, Response, NextFunction } from 'express';
interface CacheOptions {
    ttl?: number;
    keyPrefix?: string;
    keyGenerator?: (req: Request) => string;
}
export declare const cacheMiddleware: (options?: CacheOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const invalidateCache: (pattern: string) => (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const clearResourceCache: (resourceType: string, resourceId?: string) => Promise<void>;
export declare const cacheKeyGenerators: {
    userSpecific: (prefix: string) => (req: Request) => string;
    projectSpecific: (prefix: string) => (req: Request) => string;
    resourceSpecific: (prefix: string, paramName: string) => (req: Request) => string;
};
export {};
//# sourceMappingURL=cache.d.ts.map