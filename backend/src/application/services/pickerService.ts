import {
  ILabelRepository,
  ILabelHistoryRepository,
  TokenPayload,
  LabelProductInput,
} from '../../domain/interfaces';
import { LabelStatus } from '../../domain/enums';
import { NotFoundError, ValidationError } from '../../domain/errors';
import type { LabelEntity } from '../../domain/entities';

function parseLabelProducts(label: Pick<LabelEntity, 'productsJson' | 'productDescription'>): LabelProductInput[] {
  if (label.productsJson) {
    try {
      const parsed = JSON.parse(label.productsJson) as LabelProductInput[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          productName: p.productName.trim(),
          quantity: p.quantity,
        }));
      }
    } catch {
      // fallback
    }
  }
  if (label.productDescription.trim()) {
    return [{ productName: label.productDescription.trim(), quantity: 1 }];
  }
  return [];
}

interface ParsedQrData {
  id: string;
  ref: string;
  seller: string;
  company: string;
}

export class PickerService {
  constructor(
    private readonly labelRepository: ILabelRepository,
    private readonly labelHistoryRepository: ILabelHistoryRepository,
  ) {}

  async scanLabel(qrData: string, user: TokenPayload, ipAddress?: string) {
    const parsed = this.parseQrData(qrData);
    if (!parsed) {
      throw new ValidationError('Formato de código QR inválido');
    }

    const label = await this.labelRepository.findById(parsed.id);
    if (!label) {
      throw new NotFoundError(`Etiqueta ${parsed.id} no encontrada`);
    }

    if (label.companyId !== user.companyId) {
      throw new NotFoundError('Etiqueta no encontrada en su empresa');
    }

    if (label.status === LabelStatus.DESPACHADA) {
      return {
        labelId: label.id,
        externalReference: label.externalReference,
        status: LabelStatus.DESPACHADA,
        alreadyDispatched: true,
      };
    }

    const previousStatus = label.status;

    await this.labelRepository.update(parsed.id, {
      status: LabelStatus.DESPACHADA,
      scannedBy: user.userId,
      scannedAt: new Date(),
    });

    await this.labelHistoryRepository.createEvent({
      labelId: parsed.id,
      companyId: label.companyId,
      userId: user.userId,
      eventType: 'SCAN',
      summary: 'Etiqueta despachada por Picker',
      changes: [
        {
          field: 'status',
          label: 'Estado',
          from: previousStatus,
          to: LabelStatus.DESPACHADA,
        },
      ],
      ipAddress,
    });

    return {
      labelId: parsed.id,
      externalReference: label.externalReference,
      status: LabelStatus.DESPACHADA,
      alreadyDispatched: false,
    };
  }

  async getPendingDispatchLabels(user: TokenPayload) {
    const labels = await this.labelRepository.findByCompany(user.companyId);
    const pending = labels.filter(
      (l) => l.status === LabelStatus.DESCARGADA || l.status === LabelStatus.PENDIENTE,
    );

    if (pending.length === 0) {
      return { total: 0, labels: [] };
    }

    const summaries = await this.labelHistoryRepository.getLabelDownloadSummaries(
      pending.map((l) => l.id),
      user.companyId,
    );
    const summaryMap = new Map(summaries.map((s) => [s.labelId, s]));

    const dispatched = pending
      .filter((l) => {
        if (l.status === LabelStatus.DESCARGADA) return true;
        const summary = summaryMap.get(l.id);
        return summary && summary.downloadCount > 0;
      })
      .map((l) => {
        const summary = summaryMap.get(l.id)!;
        const products = parseLabelProducts(l);
        return {
          id: l.id,
          externalReference: l.externalReference,
          products,
          downloadCount: summary.downloadCount,
          lastDownloadedAt: summary.lastDownloadedAt,
        };
      });

    return { total: dispatched.length, labels: dispatched };
  }

  private parseQrData(qrData: string): ParsedQrData | null {
    let data = qrData;
    const prefix = 'LA,';
    if (data.startsWith(prefix)) {
      data = data.slice(prefix.length);
    }

    const parts = data.split(';');
    const map = new Map<string, string>();

    for (const part of parts) {
      const eqIndex = part.indexOf('=');
      if (eqIndex === -1) continue;
      const key = part.slice(0, eqIndex);
      const value = part.slice(eqIndex + 1);
      if (key) {
        map.set(key, value);
      }
    }

    const id = map.get('ID');
    if (!id) return null;

    return {
      id,
      ref: map.get('REF') ?? '',
      seller: map.get('SELLER') ?? '',
      company: map.get('COMPANY') ?? '',
    };
  }
}
