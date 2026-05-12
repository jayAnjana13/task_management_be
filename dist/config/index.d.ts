export declare const config: {
    readonly nodeEnv: string;
    readonly port: number;
    readonly apiVersion: string;
    readonly db: {
        readonly host: string | undefined;
        readonly port: number;
        readonly name: string | undefined;
        readonly user: string | undefined;
        readonly password: string;
    };
    readonly redis: {
        readonly host: string | undefined;
        readonly port: number;
        readonly password: string | undefined;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly refreshSecret: string;
        readonly refreshExpiresIn: string;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly corsOrigin: string | undefined;
    readonly pagination: {
        readonly defaultPageSize: number;
        readonly maxPageSize: number;
    };
};
export type Config = typeof config;
//# sourceMappingURL=index.d.ts.map