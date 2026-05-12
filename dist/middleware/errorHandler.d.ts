import { Request, Response, NextFunction } from 'express';
export declare const notFoundHandler: (req: Request, res: Response, _next: NextFunction) => void;
export declare const errorHandler: (error: Error, _req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map