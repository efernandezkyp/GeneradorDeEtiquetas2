import {
  ICompanyRepository,
  IUserRepository,
  ILabelRepository,
  TokenPayload,
} from '../../domain/interfaces';
import { Role } from '../../domain/enums';
import { ForbiddenError } from '../../domain/errors';

export class TenantGuard {
  static assertCompanyAccess(user: TokenPayload, companyId: string): void {
    if (user.role === Role.SUPER_ADMIN) return;
    if (user.companyId !== companyId) {
      throw new ForbiddenError('No tiene acceso a los datos de esta empresa');
    }
  }

  static getCompanyFilter(user: TokenPayload): string | undefined {
    if (user.role === Role.SUPER_ADMIN) return undefined;
    return user.companyId;
  }

  static assertRole(user: TokenPayload, allowedRoles: Role[]): void {
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError('No tiene permisos para realizar esta acción');
    }
  }

  static assertCanManageUsers(user: TokenPayload, targetCompanyId: string): void {
    if (user.role === Role.SUPER_ADMIN) return;
    if (user.role === Role.ADMIN && user.companyId === targetCompanyId) return;
    throw new ForbiddenError('No tiene permisos para gestionar usuarios');
  }

  static assertCanManageCompanies(user: TokenPayload): void {
    TenantGuard.assertRole(user, [Role.SUPER_ADMIN]);
  }

  static assertCanManageLabels(user: TokenPayload): void {
    TenantGuard.assertRole(user, [Role.SUPER_ADMIN, Role.ADMIN, Role.ASESOR]);
  }
}

export class DashboardService {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly userRepository: IUserRepository,
    private readonly labelRepository: ILabelRepository,
  ) {}

  async getStats(user: TokenPayload) {
    const companyId = TenantGuard.getCompanyFilter(user);
    const isSuperAdmin = user.role === Role.SUPER_ADMIN;

    const [totalLabels, labelsThisMonth, activeUsers, activeCompanies] = await Promise.all([
      this.labelRepository.count(companyId),
      this.labelRepository.countThisMonth(companyId),
      this.userRepository.countActive(companyId),
      isSuperAdmin ? this.companyRepository.countActive() : Promise.resolve(0),
    ]);

    return {
      totalLabels,
      labelsThisMonth,
      activeUsers,
      activeCompanies: isSuperAdmin ? activeCompanies : undefined,
    };
  }
}
