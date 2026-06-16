import { PrismaCompanyRepository } from '../infrastructure/repositories/companyRepository';
import { PrismaUserRepository } from '../infrastructure/repositories/userRepository';
import { PrismaLabelRepository } from '../infrastructure/repositories/labelRepository';
import { PrismaLabelHistoryRepository } from '../infrastructure/repositories/labelHistoryRepository';
import { PrismaAuditLogRepository } from '../infrastructure/repositories/auditLogRepository';
import { PrismaRefreshTokenRepository } from '../infrastructure/repositories/refreshTokenRepository';
import { JwtTokenService } from '../infrastructure/auth/tokenService';
import { BcryptPasswordHasher } from '../infrastructure/auth/passwordHasher';
import { GoogleAuthService } from '../infrastructure/auth/googleAuthService';
import { zplTemplateEngine } from '../infrastructure/zpl/templateEngine';
import { AuditService } from '../application/services/auditService';
import { AuthService } from '../application/services/authService';
import { CompanyService } from '../application/services/companyService';
import { UserService } from '../application/services/userService';
import { LabelService } from '../application/services/labelService';
import { DashboardService } from '../application/services/tenantGuard';
import { AuthController } from '../presentation/controllers/authController';
import { CompanyController } from '../presentation/controllers/companyController';
import { UserController } from '../presentation/controllers/userController';
import { LabelController } from '../presentation/controllers/labelController';
import { createAuthMiddleware } from '../presentation/middlewares/authMiddleware';

const companyRepository = new PrismaCompanyRepository();
const userRepository = new PrismaUserRepository();
const labelRepository = new PrismaLabelRepository();
const labelHistoryRepository = new PrismaLabelHistoryRepository();
const auditLogRepository = new PrismaAuditLogRepository();
const refreshTokenRepository = new PrismaRefreshTokenRepository();
const tokenService = new JwtTokenService();
const passwordHasher = new BcryptPasswordHasher();
const googleAuthService = new GoogleAuthService();

const auditService = new AuditService(auditLogRepository);
const authService = new AuthService(
  userRepository,
  refreshTokenRepository,
  tokenService,
  passwordHasher,
  googleAuthService,
  auditService,
  tokenService,
);
const companyService = new CompanyService(companyRepository, auditService);
const userService = new UserService(
  userRepository,
  companyRepository,
  passwordHasher,
  auditService,
);
const labelService = new LabelService(
  companyRepository,
  labelHistoryRepository,
  labelRepository,
  zplTemplateEngine,
);
const dashboardService = new DashboardService(
  companyRepository,
  userRepository,
  labelRepository,
);

export const container = {
  authController: new AuthController(authService),
  companyController: new CompanyController(companyService),
  userController: new UserController(userService),
  labelController: new LabelController(labelService, dashboardService),
  authMiddleware: createAuthMiddleware(tokenService),
};
