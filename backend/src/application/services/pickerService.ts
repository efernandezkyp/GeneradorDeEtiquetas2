import {
  ILabelRepository,
  ILabelHistoryRepository,
  TokenPayload,
} from '../../domain/interfaces';
import { LabelStatus } from '../../domain/enums';
import { NotFoundError, ValidationError } from '../../domain/errors';

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
          from: LabelStatus.PENDIENTE,
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
