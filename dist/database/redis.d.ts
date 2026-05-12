import Redis from 'ioredis';
declare const redis: Redis;
export declare const cache: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delByPattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    flush(): Promise<void>;
};
export declare function generateCacheKey(prefix: string, params: Record<string, any>): string;
export declare function checkRedisHealth(): Promise<boolean>;
export declare function closeRedis(): Promise<void>;
export { redis };
//# sourceMappingURL=redis.d.ts.map