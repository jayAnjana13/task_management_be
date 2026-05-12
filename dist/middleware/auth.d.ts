import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: "admin" | "user";
                firstName: string;
                lastName: string;
            };
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...allowedRoles: Array<"admin" | "user">) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const adminOnly: (req: Request, _res: Response, next: NextFunction) => void;
export declare function generateTokens(user: {
    id: string;
    email: string;
    role: "admin" | "user";
}): {
    accessToken: string;
    refreshToken: string;
};
export declare function verifyRefreshToken(token: string): {
    userId: string;
};
//# sourceMappingURL=auth.d.ts.map