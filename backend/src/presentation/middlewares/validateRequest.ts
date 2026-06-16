import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { toAppError } from '../../domain/errors';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(toAppError(error));
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      (req as Request & { validatedQuery?: T }).validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      next(toAppError(error));
    }
  };
}
