import { randomUUID } from 'crypto';
import {
  ICompanyRepository,
  ILabelHistoryRepository,
  ILabelRepository,
  IZplTemplateEngine,
  TokenPayload,
  LabelHistoryChange,
} from '../../domain/interfaces';
import { NotFoundError, ValidationError } from '../../domain/errors';
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

function formatProducts(products: LabelProductInput[]): string {
  return products.map((product) => `${product.quantity} x ${product.productName}`).join(' | ');
}

function buildLabelSnapshot(
  source: Pick<
    LabelEntity,
    | 'externalReference'
    | 'reason'
    | 'address'
    | 'phone'
    | 'receiver'
    | 'originCompany'
    | 'destinationCompany'
  >,
  products: LabelProductInput[],
) {
  return {
    externalReference: source.externalReference,
    reason: source.reason,
    products: formatProducts(products),
    address: source.address,
    phone: source.phone,
    receiver: source.receiver,
    originCompany: source.originCompany,
    destinationCompany: source.destinationCompany,
  };
}

function stringifyHistoryValue(value: string): string {
  return value.trim() ? value : '(vacío)';
}

function buildUpdateChanges(
  existing: LabelEntity,
  dto: UpdateLabelDto,
  products: LabelProductInput[],
): LabelHistoryChange[] {
  const changes: LabelHistoryChange[] = [];
  const textFields: Array<{ key: keyof UpdateLabelDto; label: string }> = [
    { key: 'externalReference', label: 'Referencia externa' },
    { key: 'reason', label: 'Motivo' },
    { key: 'address', label: 'Dirección' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'receiver', label: 'Destinatario' },
  ];

  for (const field of textFields) {
    const nextValue = dto[field.key];
    if (typeof nextValue !== 'string') {
      continue;
    }

    const previousValue = existing[field.key as keyof LabelEntity];
    if (typeof previousValue === 'string' && previousValue !== nextValue) {
      changes.push({
        field: field.key,
        label: field.label,
        from: stringifyHistoryValue(previousValue),
        to: stringifyHistoryValue(nextValue),
      });
    }
  }

  if (dto.products) {
    const previousProducts = formatProducts(parseProducts(existing));
    const nextProducts = formatProducts(products);
    if (previousProducts !== nextProducts) {
      changes.push({
        field: 'products',
        label: 'Productos',
        from: stringifyHistoryValue(previousProducts),
        to: stringifyHistoryValue(nextProducts),
      });
    }
  }

  return changes;
}

export class LabelService {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly labelHistoryRepository: ILabelHistoryRepository,
    private readonly labelRepository: ILabelRepository,
    private readonly zplEngine: IZplTemplateEngine,
  ) {}

  async findAll(filters: LabelFiltersDto, user: TokenPayload) {
    TenantGuard.assertCanViewLabels(user);

    const companyId = TenantGuard.getCompanyFilter(user);
    const result = await this.labelRepository.findAll({
      companyId,
      externalReference: filters.externalReference,
      receiver: filters.receiver,
      createdBy: filters.createdBy,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      page: filters.page,
      limit: filters.limit,
    });

    const downloadSummaries = await this.labelHistoryRepository.getLabelDownloadSummaries(
      result.labels.map((label) => label.id),
      companyId,
    );
    const downloadSummaryMap = new Map(
      downloadSummaries.map((summary) => [summary.labelId, summary]),
    );

    return {
      total: result.total,
      labels: result.labels.map((label) => {
        const summary = downloadSummaryMap.get(label.id);
        const downloadCount = summary?.downloadCount ?? 0;
        return {
          ...label,
          downloaded: downloadCount > 0,
          downloadCount,
          lastDownloadedAt: summary?.lastDownloadedAt ?? null,
        };
      }),
    };
  }

  async findById(id: string, user: TokenPayload) {
    TenantGuard.assertCanViewLabels(user);

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
    const labelId = randomUUID();
    const zplContent = this.zplEngine.generate({
      id: labelId,
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
      id: labelId,
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

    await this.labelHistoryRepository.createEvent({
      labelId: label.id,
      companyId: user.companyId,
      userId: user.userId,
      eventType: 'CREATE',
      summary: 'Etiqueta creada',
      metadata: {
        snapshot: buildLabelSnapshot(label, products),
      },
      ipAddress,
    });

    return label;
  }

  async bulkCreate(dtos: CreateLabelDto[], user: TokenPayload, ipAddress?: string) {
    TenantGuard.assertCanManageLabels(user);

    let created = 0;
    const failed: Array<{ index: number; message: string }> = [];

    for (let index = 0; index < dtos.length; index += 1) {
      try {
        await this.create(dtos[index], user, ipAddress);
        created += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        failed.push({ index, message });
      }
    }

    return { created, failed };
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
      id: existing.id,
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

    await this.labelHistoryRepository.createEvent({
      labelId: id,
      companyId: existing.companyId,
      userId: user.userId,
      eventType: 'UPDATE',
      summary: 'Etiqueta modificada',
      changes: buildUpdateChanges(existing, dto, products),
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

    await this.labelHistoryRepository.createEvent({
      labelId: id,
      companyId: existing.companyId,
      userId: user.userId,
      eventType: 'DELETE',
      summary: 'Etiqueta eliminada',
      metadata: {
        snapshot: buildLabelSnapshot(existing, parseProducts(existing)),
      },
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

  async downloadZpl(
    id: string,
    user: TokenPayload,
    ipAddress?: string,
    downloadType: 'single' | 'bulk' = 'single',
  ): Promise<{ zplContent: string; downloaded: boolean; downloadCount: number; lastDownloadedAt: Date | null }> {
    const label = await this.findById(id, user);

    await this.labelHistoryRepository.createDownload({
      labelId: id,
      companyId: label.companyId,
      userId: user.userId,
      downloadType,
      metadata: {
        labelId: id,
      },
      ipAddress,
    });

    const [summary] = await this.labelHistoryRepository.getLabelDownloadSummaries(
      [id],
      label.companyId,
    );

    return {
      zplContent: label.zplContent,
      downloaded: (summary?.downloadCount ?? 0) > 0,
      downloadCount: summary?.downloadCount ?? 0,
      lastDownloadedAt: summary?.lastDownloadedAt ?? null,
    };
  }

  async getDetail(id: string, user: TokenPayload) {
    const label = await this.findById(id, user);
    const [historyEntries, downloadSummaries] = await Promise.all([
      this.labelHistoryRepository.getLabelHistory(id, label.companyId),
      this.labelHistoryRepository.getLabelDownloadSummaries([id], label.companyId),
    ]);
    const summary = downloadSummaries[0];

    return {
      label: {
        ...label,
        downloaded: (summary?.downloadCount ?? 0) > 0,
        downloadCount: summary?.downloadCount ?? 0,
        lastDownloadedAt: summary?.lastDownloadedAt ?? null,
      },
      history: historyEntries,
    };
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
      id: 'preview',
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
