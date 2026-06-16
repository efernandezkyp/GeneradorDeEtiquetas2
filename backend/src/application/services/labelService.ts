import {
  ICompanyRepository,
  ILabelRepository,
  IZplTemplateEngine,
  TokenPayload,
} from '../../domain/interfaces';
import { AuditAction } from '../../domain/enums';
import { NotFoundError, ValidationError } from '../../domain/errors';
import { AuditService } from './auditService';
import { TenantGuard } from './tenantGuard';
import { CreateLabelDto, UpdateLabelDto, LabelFiltersDto } from '../dto';
import { LabelEntity } from '../../domain/entities';
import { LabelProductInput } from '../../domain/interfaces';

function normalizeProducts(products: LabelProductInput[]): LabelProductInput[] {
  return products.map((product) => ({
    productName: product.productName.trim(),
    quantity: product.quantity,
  }));
}

function buildProductDescription(products: LabelProductInput[]): string {
  return products.map((product) => `${product.quantity} x ${product.productName}`).join(' | ');
}

function serializeProducts(products: LabelProductInput[]): string {
  return JSON.stringify(products);
}

function parseProducts(entity: Pick<LabelEntity, 'productsJson' | 'productDescription'>): LabelProductInput[] {
  if (entity.productsJson) {
    try {
      const parsed = JSON.parse(entity.productsJson) as LabelProductInput[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeProducts(parsed);
      }
    } catch {
      // Fallback below for legacy records.
    }
  }

  if (!entity.productDescription.trim()) {
    return [];
  }

  return [{ productName: entity.productDescription.trim(), quantity: 1 }];
}

export class LabelService {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly labelRepository: ILabelRepository,
    private readonly zplEngine: IZplTemplateEngine,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filters: LabelFiltersDto, user: TokenPayload) {
    TenantGuard.assertCanManageLabels(user);

    const companyId = TenantGuard.getCompanyFilter(user);
    const result = await this.labelRepository.findAll({
      companyId,
      externalReference: filters.externalReference,
      createdBy: filters.createdBy,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      page: filters.page,
      limit: filters.limit,
    });

    return result;
  }

  async findById(id: string, user: TokenPayload) {
    TenantGuard.assertCanManageLabels(user);

    const label = await this.labelRepository.findById(id);
    if (!label) throw new NotFoundError('Etiqueta no encontrada');

    TenantGuard.assertCompanyAccess(user, label.companyId);
    return label;
  }

  async create(dto: CreateLabelDto, user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageLabels(user);

    const company = await this.companyRepository.findById(user.companyId);
    if (!company) throw new NotFoundError('Empresa no encontrada');
    const originCompany = company.defaultOriginCompany?.trim() || company.name;
    const destinationCompany = company.defaultDestinationCompany?.trim() || '';
    if (!destinationCompany) {
      throw new ValidationError('La empresa destino no está configurada para tu empresa.');
    }

    const products = normalizeProducts(dto.products);
    const productDescription = buildProductDescription(products);
    const productsJson = serializeProducts(products);
    const zplContent = this.zplEngine.generate({
      externalReference: dto.externalReference,
      reason: dto.reason,
      products,
      address: dto.address,
      phone: dto.phone,
      receiver: dto.receiver,
      originCompany,
      destinationCompany,
    });

    const label = await this.labelRepository.create({
      companyId: user.companyId,
      externalReference: dto.externalReference,
      reason: dto.reason,
      productDescription,
      productsJson,
      address: dto.address,
      phone: dto.phone,
      receiver: dto.receiver,
      originCompany,
      destinationCompany,
      zplContent,
      createdBy: user.userId,
    });

    await this.auditService.log({
      userId: user.userId,
      companyId: user.companyId,
      action: AuditAction.CREATE,
      entity: 'Label',
      entityId: label.id,
      details: JSON.stringify({ externalReference: label.externalReference }),
      ipAddress,
    });

    return label;
  }

  async update(id: string, dto: UpdateLabelDto, user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageLabels(user);

    const existing = await this.labelRepository.findById(id);
    if (!existing) throw new NotFoundError('Etiqueta no encontrada');

    TenantGuard.assertCompanyAccess(user, existing.companyId);

    const merged = { ...existing, ...dto };
    const products = dto.products ? normalizeProducts(dto.products) : parseProducts(existing);
    const productDescription = buildProductDescription(products);
    const productsJson = serializeProducts(products);
    const zplContent = this.zplEngine.generate({
      externalReference: merged.externalReference,
      reason: merged.reason,
      products,
      address: merged.address,
      phone: merged.phone,
      receiver: merged.receiver,
      originCompany: merged.originCompany,
      destinationCompany: merged.destinationCompany,
    });

    const label = await this.labelRepository.update(id, {
      externalReference: dto.externalReference,
      reason: dto.reason,
      productDescription,
      productsJson,
      address: dto.address,
      phone: dto.phone,
      receiver: dto.receiver,
      zplContent,
    });

    await this.auditService.log({
      userId: user.userId,
      companyId: existing.companyId,
      action: AuditAction.UPDATE,
      entity: 'Label',
      entityId: id,
      ipAddress,
    });

    return label;
  }

  async delete(id: string, user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageLabels(user);

    const existing = await this.labelRepository.findById(id);
    if (!existing) throw new NotFoundError('Etiqueta no encontrada');

    TenantGuard.assertCompanyAccess(user, existing.companyId);

    await this.labelRepository.delete(id);

    await this.auditService.log({
      userId: user.userId,
      companyId: existing.companyId,
      action: AuditAction.DELETE,
      entity: 'Label',
      entityId: id,
      ipAddress,
    });
  }

  async duplicate(id: string, user: TokenPayload, ipAddress?: string) {
    const existing = await this.findById(id, user);

    return this.create(
      {
        externalReference: `${existing.externalReference}-COPY`,
        reason: existing.reason,
        products: parseProducts(existing),
        address: existing.address,
        phone: existing.phone,
        receiver: existing.receiver,
      },
      user,
      ipAddress,
    );
  }

  async getZpl(id: string, user: TokenPayload): Promise<string> {
    const label = await this.findById(id, user);
    return label.zplContent;
  }

  async preview(dto: CreateLabelDto, user: TokenPayload): Promise<string> {
    TenantGuard.assertCanManageLabels(user);
    const company = await this.companyRepository.findById(user.companyId);
    if (!company) throw new NotFoundError('Empresa no encontrada');
    const originCompany = company.defaultOriginCompany?.trim() || company.name;
    const destinationCompany = company.defaultDestinationCompany?.trim() || '';
    if (!destinationCompany) {
      throw new ValidationError('La empresa destino no está configurada para tu empresa.');
    }
    const products = normalizeProducts(dto.products);
    return this.zplEngine.generate({
      externalReference: dto.externalReference,
      reason: dto.reason,
      products,
      address: dto.address,
      phone: dto.phone,
      receiver: dto.receiver,
      originCompany,
      destinationCompany,
    });
  }
}
