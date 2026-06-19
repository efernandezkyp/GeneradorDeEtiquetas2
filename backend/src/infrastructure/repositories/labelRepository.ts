import { prisma } from '../prisma/client';
import {
  ILabelRepository,
  CreateLabelData,
  UpdateLabelData,
  LabelFilters,
} from '../../domain/interfaces';
import { LabelEntity } from '../../domain/entities';
import { LabelStatus } from '../../domain/enums';

function mapLabel(label: {
  id: string;
  companyId: string;
  externalReference: string;
  reason: string;
  productDescription: string;
  productsJson: string;
  address: string;
  phone: string;
  receiver: string;
  originCompany: string;
  destinationCompany: string;
  zplContent: string;
  createdBy: string;
  status: string;
  scannedBy: string | null;
  scannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): LabelEntity {
  return {
    ...label,
    status: label.status as LabelStatus,
  };
}

export class PrismaLabelRepository implements ILabelRepository {
  async findAll(filters: LabelFilters): Promise<{ labels: LabelEntity[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters.externalReference) {
      where.externalReference = { contains: filters.externalReference };
    }
    if (filters.receiver) {
      where.receiver = { contains: filters.receiver };
    }
    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, Date>).lte = filters.endDate;
      }
    }

    const [labels, total] = await Promise.all([
      prisma.label.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.label.count({ where }),
    ]);

    return { labels: labels.map(mapLabel), total };
  }

  async findById(id: string): Promise<LabelEntity | null> {
    const label = await prisma.label.findUnique({ where: { id } });
    return label ? mapLabel(label) : null;
  }

  async create(data: CreateLabelData): Promise<LabelEntity> {
    const label = await prisma.label.create({ data });
    return mapLabel(label);
  }

  async update(id: string, data: UpdateLabelData): Promise<LabelEntity> {
    const label = await prisma.label.update({ where: { id }, data });
    return mapLabel(label);
  }

  async delete(id: string): Promise<void> {
    await prisma.label.delete({ where: { id } });
  }

  async count(companyId?: string): Promise<number> {
    return prisma.label.count({
      where: companyId ? { companyId } : undefined,
    });
  }

  async countThisMonth(companyId?: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return prisma.label.count({
      where: {
        createdAt: { gte: startOfMonth },
        ...(companyId ? { companyId } : {}),
      },
    });
  }
}
