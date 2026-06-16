import { prisma } from '../prisma/client';
import { IAuditLogRepository, CreateAuditLogData } from '../../domain/interfaces';
import { AuditLogEntity } from '../../domain/entities';
import { AuditAction } from '../../domain/enums';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  async create(data: CreateAuditLogData): Promise<AuditLogEntity> {
    const log = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        action: data.action as AuditAction,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
      },
    });
    return log;
  }
}
