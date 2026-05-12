import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
type ValidationTarget = 'body' | 'query' | 'params';
export declare const validate: (schema: ZodSchema, target?: ValidationTarget) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const validateMultiple: (validations: Array<{
    schema: ZodSchema;
    target: ValidationTarget;
}>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBody: (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const validateQuery: (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const validateParams: (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=validate.d.ts.map