import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../../domain/interfaces';
import { Role } from '../../domain/enums';
import { UnauthorizedError, ForbiddenError, toAppError } from '../../domain/errors';
import { JwtTokenService } from '../../infrastructure/auth/tokenService';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function createAuthMiddleware(tokenService: JwtTokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Token de acceso requerido');
      }

      const token = authHeader.substring(7);
      req.user = tokenService.verifyAccessToken(token);
      next();
    } catch (error) {
      next(toAppError(error));
    }
  };
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('No tiene permisos para realizar esta acción');
      }
      next();
    } catch (error) {
      next(toAppError(error));
    }
  };
}

export function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '';
}
