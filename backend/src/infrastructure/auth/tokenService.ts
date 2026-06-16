import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../domain/interfaces';
import { Role } from '../../domain/enums';
import { config } from '../../config';
import { UnauthorizedError } from '../../domain/errors';

export class JwtTokenService implements ITokenService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return decoded;
    } catch {
      throw new UnauthorizedError('Token de acceso inválido o expirado');
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
      return decoded;
    } catch {
      throw new UnauthorizedError('Token de refresco inválido o expirado');
    }
  }

  static parseExpiresIn(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      now.setDate(now.getDate() + 7);
      return now;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }
    return now;
  }

  getRefreshTokenExpiry(): Date {
    return JwtTokenService.parseExpiresIn(config.jwt.refreshExpiresIn);
  }
}

export function createTokenPayload(user: {
  id: string;
  email: string;
  role: Role;
  companyId: string;
}): TokenPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };
}
