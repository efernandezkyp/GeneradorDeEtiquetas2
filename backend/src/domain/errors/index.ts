export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = 'DOMAIN_ERROR',
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends DomainError {
  constructor(message: string = 'Conflicto de datos') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string = 'Datos inválidos') {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof DomainError) {
    return new AppError(error.message, error.statusCode, error.code);
  }
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ message: string }> };
    const message = zodError.issues.map((i) => i.message).join(', ');
    return new AppError(message, 422, 'VALIDATION_ERROR');
  }
  if (error instanceof Error) {
    return new AppError(error.message, 500, 'INTERNAL_ERROR');
  }
  return new AppError('Error interno del servidor', 500, 'INTERNAL_ERROR');
}
