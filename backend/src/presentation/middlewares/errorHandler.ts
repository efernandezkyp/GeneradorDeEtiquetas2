import { AppError } from '../../domain/errors';

export function errorHandler(
  err: Error,
  _req: import('express').Request,
  res: import('express').Response,
  _next: import('express').NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    },
  });
}
