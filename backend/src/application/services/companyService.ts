import { ICompanyRepository, TokenPayload } from '../../domain/interfaces';
import { AuditAction } from '../../domain/enums';
import { NotFoundError, ConflictError } from '../../domain/errors';
import { AuditService } from './auditService';
import { TenantGuard } from './tenantGuard';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto';

export class CompanyService {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly auditService: AuditService,
  ) {}

  async getMyCompany(user: TokenPayload) {
    const company = await this.companyRepository.findById(user.companyId);
    if (!company) throw new NotFoundError('Empresa no encontrada');
    return company;
  }

  async findAll(user: TokenPayload) {
    TenantGuard.assertCanManageCompanies(user);
    return this.companyRepository.findAll();
  }

  async findById(id: string, user: TokenPayload) {
    TenantGuard.assertCanManageCompanies(user);
    const company = await this.companyRepository.findById(id);
    if (!company) throw new NotFoundError('Empresa no encontrada');
    return company;
  }

  async create(dto: CreateCompanyDto, user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageCompanies(user);

    const existing = await this.companyRepository.findByCode(dto.code);
    if (existing) throw new ConflictError('Ya existe una empresa con ese código');

    const company = await this.companyRepository.create(dto);

    await this.auditService.log({
      userId: user.userId,
      companyId: company.id,
      action: AuditAction.CREATE,
      entity: 'Company',
      entityId: company.id,
      details: JSON.stringify({ name: company.name, code: company.code }),
      ipAddress,
    });

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageCompanies(user);

    const existing = await this.companyRepository.findById(id);
    if (!existing) throw new NotFoundError('Empresa no encontrada');

    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.companyRepository.findByCode(dto.code);
      if (codeExists) throw new ConflictError('Ya existe una empresa con ese código');
    }

    const company = await this.companyRepository.update(id, dto);

    await this.auditService.log({
      userId: user.userId,
      companyId: company.id,
      action: AuditAction.UPDATE,
      entity: 'Company',
      entityId: company.id,
      details: JSON.stringify(dto),
      ipAddress,
    });

    return company;
  }

  async deactivate(id: string, user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageCompanies(user);

    const existing = await this.companyRepository.findById(id);
    if (!existing) throw new NotFoundError('Empresa no encontrada');

    const company = await this.companyRepository.update(id, { active: false });

    await this.auditService.log({
      userId: user.userId,
      companyId: company.id,
      action: AuditAction.DEACTIVATE,
      entity: 'Company',
      entityId: company.id,
      ipAddress,
    });

    return company;
  }
}
