import {
  IAuditLogRepository,
  CreateAuditLogData,
} from '../../domain/interfaces';

export class AuditService {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async log(data: CreateAuditLogData): Promise<void> {
    await this.auditLogRepository.create(data);
  }
}
