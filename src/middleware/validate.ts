import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type ValidationTarget = 'body' | 'query' | 'params';

// Validation middleware factory
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = req[target];
      const validated = await schema.parseAsync(data);
      
      // Replace with validated (and transformed) data
      req[target] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });

        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
};

// Validate multiple targets
export const validateMultiple = (
  validations: Array<{ schema: ZodSchema; target: ValidationTarget }>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const allErrors: Record<string, string[]> = {};

      for (const { schema, target } of validations) {
        try {
          const validated = await schema.parseAsync(req[target]);
          req[target] = validated;
        } catch (error) {
          if (error instanceof ZodError) {
            error.errors.forEach((err) => {
              const path = `${target}.${err.path.join('.')}`;
              if (!allErrors[path]) {
                allErrors[path] = [];
              }
              allErrors[path].push(err.message);
            });
          } else {
            throw error;
          }
        }
      }

      if (Object.keys(allErrors).length > 0) {
        throw new ValidationError(allErrors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validate request body
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

// Validate query params
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

// Validate route params
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
