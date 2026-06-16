import { randomUUID } from 'crypto';
import { prisma } from '../prisma/client';
import {
  CreateLabelDownloadEventData,
  CreateLabelHistoryEventData,
  ILabelHistoryRepository,
  LabelDownloadSummary,
  LabelHistoryEntry,
} from '../../domain/interfaces';

type LabelHistoryRow = {
  id: string;
  labelId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  companyId: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DOWNLOAD';
  summary: string;
  changesJson: string | null;
  metadataJson: string | null;
  ipAddress: string | null;
  createdAt: Date | string;
};

function parseJsonObject(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function parseChanges(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as LabelHistoryEntry['changes'];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export class PrismaLabelHistoryRepository implements ILabelHistoryRepository {
  async createEvent(data: CreateLabelHistoryEventData): Promise<void> {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "label_history_events"
        ("id", "labelId", "companyId", "userId", "eventType", "summary", "changesJson", "metadataJson", "ipAddress", "createdAt")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      randomUUID(),
      data.labelId,
      data.companyId,
      data.userId ?? null,
      data.eventType,
      data.summary,
      JSON.stringify(data.changes ?? []),
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.ipAddress ?? null,
      (data.createdAt ?? new Date()).toISOString(),
    );
  }

  async createDownload(data: CreateLabelDownloadEventData): Promise<void> {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "label_download_events"
        ("id", "labelId", "companyId", "userId", "downloadType", "metadataJson", "ipAddress", "createdAt")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      randomUUID(),
      data.labelId,
      data.companyId,
      data.userId ?? null,
      data.downloadType,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.ipAddress ?? null,
      (data.createdAt ?? new Date()).toISOString(),
    );
  }

  async getLabelHistory(labelId: string, companyId?: string): Promise<LabelHistoryEntry[]> {
    const lifecycleRows = (await prisma.$queryRawUnsafe(
      `
      SELECT
        h."id" as id,
        h."labelId" as labelId,
        h."userId" as userId,
        CASE
          WHEN u."id" IS NULL THEN 'Sistema'
          ELSE TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))
        END as userName,
        u."email" as userEmail,
        h."companyId" as companyId,
        h."eventType" as action,
        h."summary" as summary,
        h."changesJson" as changesJson,
        h."metadataJson" as metadataJson,
        h."ipAddress" as ipAddress,
        h."createdAt" as createdAt
      FROM "label_history_events" h
      LEFT JOIN "users" u ON u."id" = h."userId"
      WHERE h."labelId" = ?
        AND (? IS NULL OR h."companyId" = ?)
      `,
      labelId,
      companyId ?? null,
      companyId ?? null,
    )) as LabelHistoryRow[];

    const downloadRows = (await prisma.$queryRawUnsafe(
      `
      SELECT
        d."id" as id,
        d."labelId" as labelId,
        d."userId" as userId,
        CASE
          WHEN u."id" IS NULL THEN 'Sistema'
          ELSE TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))
        END as userName,
        u."email" as userEmail,
        d."companyId" as companyId,
        'DOWNLOAD' as action,
        CASE
          WHEN d."downloadType" = 'bulk' THEN 'Descarga masiva de etiqueta'
          ELSE 'Descarga de etiqueta'
        END as summary,
        '[]' as changesJson,
        d."metadataJson" as metadataJson,
        d."ipAddress" as ipAddress,
        d."createdAt" as createdAt
      FROM "label_download_events" d
      LEFT JOIN "users" u ON u."id" = d."userId"
      WHERE d."labelId" = ?
        AND (? IS NULL OR d."companyId" = ?)
      `,
      labelId,
      companyId ?? null,
      companyId ?? null,
    )) as LabelHistoryRow[];

    return [...lifecycleRows, ...downloadRows]
      .map((row) => ({
        id: row.id,
        labelId: row.labelId,
        userId: row.userId,
        userName: row.userName?.trim() || 'Sistema',
        userEmail: row.userEmail,
        companyId: row.companyId,
        action: row.action,
        summary: row.summary,
        changes: parseChanges(row.changesJson),
        metadata: parseJsonObject(row.metadataJson),
        ipAddress: row.ipAddress,
        createdAt: toDate(row.createdAt),
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getLabelDownloadSummaries(labelIds: string[], companyId?: string): Promise<LabelDownloadSummary[]> {
    if (labelIds.length === 0) {
      return [];
    }

    const placeholders = labelIds.map(() => '?').join(', ');
    const rows = (await prisma.$queryRawUnsafe(
      `
      SELECT
        d."labelId" as labelId,
        COUNT(*) as downloadCount,
        MAX(d."createdAt") as lastDownloadedAt
      FROM "label_download_events" d
      WHERE d."labelId" IN (${placeholders})
        AND (? IS NULL OR d."companyId" = ?)
      GROUP BY d."labelId"
      `,
      ...labelIds,
      companyId ?? null,
      companyId ?? null,
    )) as Array<{ labelId: string; downloadCount: number | bigint; lastDownloadedAt: Date | string | null }>;

    return rows.map((row) => ({
      labelId: row.labelId,
      downloadCount: Number(row.downloadCount),
      lastDownloadedAt: row.lastDownloadedAt ? toDate(row.lastDownloadedAt) : null,
    }));
  }
}
