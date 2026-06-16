import {
  IUserRepository,
  ICompanyRepository,
  IPasswordHasher,
  TokenPayload,
} from '../../domain/interfaces';
import { Role, AuditAction } from '../../domain/enums';
import { NotFoundError, ConflictError, ForbiddenError } from '../../domain/errors';
import { AuditService } from './auditService';
import { TenantGuard } from './tenantGuard';
import { CreateUserDto, UpdateUserDto } from '../dto';

function sanitizeUser(user: {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    companyId: user.companyId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly companyRepository: ICompanyRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: TokenPayload) {
    if (user.role === Role.SUPER_ADMIN) {
      const users = await this.userRepository.findAll();
      return users.map(sanitizeUser);
    }
    if (user.role === Role.ADMIN) {
      const users = await this.userRepository.findAll(user.companyId);
      return users.map(sanitizeUser);
    }
    throw new ForbiddenError('No tiene permisos para ver usuarios');
  }

  async findById(id: string, user: TokenPayload) {
    const found = await this.userRepository.findById(id);
    if (!found) throw new NotFoundError('Usuario no encontrado');

    TenantGuard.assertCanManageUsers(user, found.companyId);
    return sanitizeUser(found);
  }

  async create(dto: CreateUserDto, user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageUsers(user, dto.companyId);

    if (user.role === Role.ADMIN) {
      if (dto.role === Role.SUPER_ADMIN) {
        throw new ForbiddenError('No puede crear usuarios SuperAdmin');
      }
      if (dto.companyId !== user.companyId) {
        throw new ForbiddenError('Solo puede crear usuarios de su empresa');
      }
    }

    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) throw new NotFoundError('Empresa no encontrada');

    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) throw new ConflictError('Ya existe un usuario con ese email');

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const created = await this.userRepository.create({
      ...dto,
      password: passwordHash,
    });

    await this.auditService.log({
      userId: user.userId,
      companyId: created.companyId,
      action: AuditAction.CREATE,
      entity: 'User',
      entityId: created.id,
      details: JSON.stringify({ email: created.email, role: created.role }),
      ipAddress,
    });

    return sanitizeUser(created);
  }

  async update(id: string, dto: UpdateUserDto, user: TokenPayload, ipAddress?: string) {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundError('Usuario no encontrado');

    TenantGuard.assertCanManageUsers(user, existing.companyId);

    if (user.role === Role.ADMIN && dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('No puede asignar rol SuperAdmin');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.userRepository.findByEmail(dto.email);
      if (emailExists) throw new ConflictError('Ya existe un usuario con ese email');
    }

    const updateData: UpdateUserDto & { password?: string } = { ...dto };
    if (dto.password) {
      updateData.password = await this.passwordHasher.hash(dto.password);
    }

    const updated = await this.userRepository.update(id, updateData);

    await this.auditService.log({
      userId: user.userId,
      companyId: updated.companyId,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: updated.id,
      details: JSON.stringify({ ...dto, password: dto.password ? '[REDACTED]' : undefined }),
      ipAddress,
    });

    return sanitizeUser(updated);
  }

  async resetPassword(id: string, password: string, user: TokenPayload, ipAddress?: string) {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundError('Usuario no encontrado');

    TenantGuard.assertCanManageUsers(user, existing.companyId);

    const passwordHash = await this.passwordHasher.hash(password);
    await this.userRepository.update(id, { password: passwordHash });

    await this.auditService.log({
      userId: user.userId,
      companyId: existing.companyId,
      action: AuditAction.PASSWORD_RESET,
      entity: 'User',
      entityId: id,
      ipAddress,
    });
  }

  async deactivate(id: string, user: TokenPayload, ipAddress?: string) {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundError('Usuario no encontrado');

    TenantGuard.assertCanManageUsers(user, existing.companyId);

    const updated = await this.userRepository.update(id, { active: false });

    await this.auditService.log({
      userId: user.userId,
      companyId: existing.companyId,
      action: AuditAction.DEACTIVATE,
      entity: 'User',
      entityId: id,
      ipAddress,
    });

    return sanitizeUser(updated);
  }
}
