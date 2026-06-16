import {
  IUserRepository,
  IRefreshTokenRepository,
  ITokenService,
  IGoogleAuthService,
  IPasswordHasher,
  TokenPayload,
} from '../../domain/interfaces';
import { AuditAction } from '../../domain/enums';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors';
import { AuditService } from './auditService';
import { JwtTokenService, createTokenPayload } from '../../infrastructure/auth/tokenService';
import { LoginDto } from '../dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUserProfile;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordHasher: IPasswordHasher,
    private readonly googleAuthService: IGoogleAuthService,
    private readonly auditService: AuditService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const isValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.active) {
      throw new ForbiddenError('Su cuenta ha sido desactivada');
    }

    return this.generateTokens(user, ipAddress);
  }

  async loginWithGoogle(idToken: string, ipAddress?: string): Promise<AuthTokens> {
    const googleUser = await this.googleAuthService.verifyIdToken(idToken);
    const user =
      (await this.userRepository.findByGoogleId(googleUser.googleId)) ??
      (await this.userRepository.findByEmail(googleUser.email));

    if (!user) {
      throw new ForbiddenError('Tu cuenta no ha sido habilitada por un administrador.');
    }

    if (!user.active) {
      throw new ForbiddenError('Su cuenta ha sido desactivada');
    }

    return this.generateTokens(user, ipAddress);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.active) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    await this.refreshTokenRepository.deleteByToken(refreshToken);

    const tokenPayload = createTokenPayload(user);
    const newAccessToken = this.tokenService.generateAccessToken(tokenPayload);
    const newRefreshToken = this.tokenService.generateRefreshToken(tokenPayload);

    await this.refreshTokenRepository.create(
      user.id,
      newRefreshToken,
      this.jwtTokenService.getRefreshTokenExpiry(),
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string, user: TokenPayload, ipAddress?: string): Promise<void> {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
    await this.auditService.log({
      userId: user.userId,
      companyId: user.companyId,
      action: AuditAction.LOGOUT,
      entity: 'User',
      entityId: user.userId,
      ipAddress,
    });
  }

  getGoogleAuthUrl(): string {
    return this.googleAuthService.getAuthUrl();
  }

  async handleGoogleCallback(code: string, ipAddress?: string): Promise<AuthTokens> {
    const { idToken } = await this.googleAuthService.getTokensFromCode(code);
    return this.loginWithGoogle(idToken, ipAddress);
  }

  async getCurrentUser(user: TokenPayload): Promise<AuthUserProfile> {
    const foundUser = await this.userRepository.findById(user.userId);
    if (!foundUser || !foundUser.active) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    return {
      id: foundUser.id,
      email: foundUser.email,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      role: foundUser.role,
      companyId: foundUser.companyId,
    };
  }

  private async generateTokens(
    user: {
      id: string;
      companyId: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    },
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const tokenPayload = createTokenPayload({
      id: user.id,
      email: user.email,
      role: user.role as TokenPayload['role'],
      companyId: user.companyId,
    });

    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const refreshToken = this.tokenService.generateRefreshToken(tokenPayload);

    await this.refreshTokenRepository.create(
      user.id,
      refreshToken,
      this.jwtTokenService.getRefreshTokenExpiry(),
    );

    await this.auditService.log({
      userId: user.id,
      companyId: user.companyId,
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: await this.getCurrentUser(tokenPayload),
    };
  }
}
