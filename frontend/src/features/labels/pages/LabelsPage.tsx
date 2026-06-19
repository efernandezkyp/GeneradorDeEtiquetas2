import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PageSection } from '../../../shared/components/PageSection';
import type { Label, PaginatedLabels } from '../../../shared/types/api';
import { downloadBlobFile, downloadTextFile, printText } from '../../../shared/utils/fileActions';
import { LabelZplDialog } from '../components/LabelZplDialog';
import {
  bulkCreateLabels,
  deleteLabel,
  downloadLabelZplWithMeta,
  duplicateLabel,
  getLabelZpl,
  listLabels,
  type LabelFiltersState,
} from '../api/labelsApi';
import type { LabelFormValues } from '../schemas/labelSchemas';

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return String(value);
}

function parseProductsCell(value: string): LabelFormValues['products'] {
  const raw = value.trim();
  if (!raw) {
    return [];
  }

  const items = raw
    .split(/[;\n\r]+/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return items
    .map((item) => {
      const [qtyRaw, ...nameParts] = item.split('|').map((part) => part.trim());
      const quantity = Number(qtyRaw);
      const productName = nameParts.join('|').trim();
      if (!productName || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }
      return { productName, quantity };
    })
    .filter((item): item is { productName: string; quantity: number } => Boolean(item));
}

export function LabelsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filters, setFilters] = useState<LabelFiltersState>({
    externalReference: '',
    receiver: '',
    createdBy: '',
    startDate: '',
    endDate: '',
  });
  const [zplDialog, setZplDialog] = useState<{ open: boolean; labelId: string | null; zpl: string }>({
    open: false,
    labelId: null,
    zpl: '',
  });
  const [pageError, setPageError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    failed: Array<{ index: number; message: string }>;
    skipped: Array<{ index: number; message: string }>;
  } | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const labelsQuery = useQuery({
    queryKey: ['labels', filters],
    queryFn: () => listLabels(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLabel,
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      setPageError('No fue posible eliminar la etiqueta.');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateLabel,
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      setPageError('No fue posible duplicar la etiqueta.');
    },
  });

  const updateLabelDownloadStatus = (
    labelId: string,
    status: { downloaded: boolean; downloadCount: number; lastDownloadedAt: string | null },
  ) => {
    queryClient.setQueriesData<PaginatedLabels>(
      { queryKey: ['labels'] },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          labels: oldData.labels.map((label) =>
            label.id === labelId ? { ...label, ...status } : label,
          ),
        };
      },
    );
  };

  const rows = useMemo(() => labelsQuery.data?.labels ?? [], [labelsQuery.data]);
  const selectedRows = useMemo(
    () => rows.filter((label) => selectedLabelIds.includes(label.id)),
    [rows, selectedLabelIds],
  );
  const areAllRowsSelected = rows.length > 0 && selectedRows.length === rows.length;
  const isPartiallySelected = selectedRows.length > 0 && selectedRows.length < rows.length;

  const toggleLabelSelection = (labelId: string) => {
    setSelectedLabelIds((current) =>
      current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedLabelIds((current) => {
      const currentRowIds = rows.map((label) => label.id);
      const allSelected = currentRowIds.every((id) => current.includes(id));
      if (allSelected) {
        return current.filter((id) => !currentRowIds.includes(id));
      }

      return Array.from(new Set([...current, ...currentRowIds]));
    });
  };

  const buildBulkZplContent = (labels: Array<Label & { zpl: string }>) =>
    labels
      .map(
        (label) =>
          [
            `===== ETIQUETA ${label.externalReference} (${label.id}) =====`,
            label.zpl,
          ].join('\n'),
      )
      .join('\n\n');

  const handleBulkDownload = async () => {
    if (selectedRows.length === 0) {
      setPageError('Selecciona al menos una etiqueta para descargar el ZPL.');
      return;
    }

    try {
      setPageError(null);
      const results = await Promise.all(
        selectedRows.map(async (label) => {
          const result = await downloadLabelZplWithMeta(label.id, true);
          return { ...label, ...result };
        }),
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadTextFile(
        `labels-zpl-${timestamp}.txt`,
        buildBulkZplContent(results.map((r) => ({ ...r, zpl: r.zplContent }))),
      );

      results.forEach((result) => {
        updateLabelDownloadStatus(result.id, {
          downloaded: result.downloaded,
          downloadCount: result.downloadCount,
          lastDownloadedAt: result.lastDownloadedAt,
        });
      });

      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    } catch {
      setPageError('No fue posible descargar el archivo TXT con las etiquetas seleccionadas.');
    }
  };

  const handleDownloadTemplate = () => {
    const rows = [
      ['externalReference', 'reason', 'receiver', 'phone', 'address', 'products'],
      [
        'REF-0001',
        'Envio',
        'Juan Perez',
        '1131552649',
        'Calle Falsa 123, Buenos Aires',
        '1|Producto A;2|Producto B',
      ],
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Etiquetas');

    const helpRows = [
      ['Campo', 'Descripción'],
      ['externalReference', 'Referencia externa (texto)'],
      ['reason', 'Motivo (texto)'],
      ['receiver', 'Destinatario (texto)'],
      ['phone', 'Teléfono (texto)'],
      ['address', 'Dirección (texto)'],
      ['products', 'Lista de productos: cantidad|nombre;cantidad|nombre'],
    ];
    const helpSheet = XLSX.utils.aoa_to_sheet(helpRows);
    XLSX.utils.book_append_sheet(workbook, helpSheet, 'Ayuda');

    const fileName = 'template-etiquetas.xlsx';
    const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlobFile(fileName, blob);
  };

  const handleImportFile = async (file: File) => {
    try {
      setPageError(null);
      setImportResult(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      const skipped: Array<{ index: number; message: string }> = [];
      const payload: LabelFormValues[] = [];

      rawRows.forEach((row, index) => {
        const externalReference = stringifyCell(row.externalReference).trim();
        const reason = stringifyCell(row.reason).trim();
        const receiver = stringifyCell(row.receiver).trim();
        const phone = stringifyCell(row.phone).trim();
        const address = stringifyCell(row.address).trim();
        const productsCell = stringifyCell(row.products);
        const products = parseProductsCell(productsCell);

        const missing: string[] = [];
        if (!externalReference) missing.push('externalReference');
        if (!reason) missing.push('reason');
        if (!receiver) missing.push('receiver');
        if (!phone) missing.push('phone');
        if (!address) missing.push('address');
        if (products.length === 0) missing.push('products');

        if (missing.length > 0) {
          skipped.push({
            index: index + 2,
            message: `Faltan campos: ${missing.join(', ')}`,
          });
          return;
        }

        payload.push({
          externalReference,
          reason,
          receiver,
          phone,
          address,
          products,
        });
      });

      if (payload.length === 0) {
        setImportResult({ created: 0, failed: [], skipped });
        return;
      }

      const result = await bulkCreateLabels(payload);
      setImportResult({ ...result, skipped });
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch {
      setPageError('No fue posible procesar el archivo. Verifica que sea el template y que tenga una hoja con encabezados.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <PageSection
      title="Etiquetas"
      subtitle="Creacion, edicion, duplicado, descarga e impresion de etiquetas ZPL"
      actions={
        <Stack direction="row" spacing={1}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleImportFile(file);
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={() => {
              handleDownloadTemplate();
            }}
          >
            Descargar template
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            Importar excel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              navigate('/labels/new');
            }}
          >
            Nueva etiqueta
          </Button>
        </Stack>
      }
    >
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}
      {labelsQuery.isError ? <Alert severity="error">No fue posible cargar las etiquetas.</Alert> : null}
      {importResult ? (
        <Alert severity={importResult.failed.length > 0 || importResult.skipped.length > 0 ? 'warning' : 'success'}>
          Importación: creadas {importResult.created}. Fallidas {importResult.failed.length}. Omitidas{' '}
          {importResult.skipped.length}.
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <TextField
              label="Referencia externa"
              value={filters.externalReference}
              onChange={(event) =>
                setFilters((current) => ({ ...current, externalReference: event.target.value }))
              }
            />
            <TextField
              label="Destinatario"
              value={filters.receiver}
              onChange={(event) =>
                setFilters((current) => ({ ...current, receiver: event.target.value }))
              }
            />
            <TextField
              label="Usuario creador"
              value={filters.createdBy}
              onChange={(event) =>
                setFilters((current) => ({ ...current, createdBy: event.target.value }))
              }
            />
            <TextField
              label="Fecha desde"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.startDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, startDate: event.target.value }))
              }
            />
            <TextField
              label="Fecha hasta"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.endDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
          >
            <Typography variant="body2" color="text.secondary">
              {selectedRows.length > 0
                ? `${selectedRows.length} etiqueta${selectedRows.length === 1 ? '' : 's'} seleccionada${selectedRows.length === 1 ? '' : 's'}`
                : 'Selecciona una o varias etiquetas para descargar un TXT consolidado'}
            </Typography>
            <Button variant="outlined" disabled={selectedRows.length === 0} onClick={() => void handleBulkDownload()}>
              Descargar seleccionadas
            </Button>
          </Stack>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={areAllRowsSelected}
                    indeterminate={isPartiallySelected}
                    onChange={toggleSelectAll}
                    slotProps={{ input: { 'aria-label': 'Seleccionar todas las etiquetas' } }}
                  />
                </TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Destinatario</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Descarga</TableCell>
                <TableCell>Creada</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((label) => (
                <TableRow key={label.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedLabelIds.includes(label.id)}
                      onChange={() => toggleLabelSelection(label.id)}
                      slotProps={{ input: { 'aria-label': `Seleccionar etiqueta ${label.externalReference}` } }}
                    />
                  </TableCell>
                  <TableCell>{label.externalReference}</TableCell>
                  <TableCell>{label.reason}</TableCell>
                  <TableCell>{label.receiver}</TableCell>
                  <TableCell>{label.destinationCompany}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={label.downloaded ? 'success' : 'default'}
                      label={label.downloaded ? `Descargada${label.downloadCount ? ` (${label.downloadCount})` : ''}` : 'Pendiente'}
                      variant={label.downloaded ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>{new Date(label.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        onClick={() => {
                          navigate(`/labels/${label.id}`);
                        }}
                      >
                        Ver
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          navigate(`/labels/${label.id}/edit`);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          void duplicateMutation.mutateAsync(label.id);
                        }}
                      >
                        Duplicar
                      </Button>
                      <Button
                        size="small"
                        onClick={async () => {
                          const zpl = await getLabelZpl(label.id);
                          setZplDialog({ open: true, labelId: label.id, zpl });
                        }}
                      >
                        Ver ZPL
                      </Button>
                      <Button
                        size="small"
                        onClick={async () => {
                          try {
                            const result = await downloadLabelZplWithMeta(label.id);
                            downloadTextFile(`label-${label.id}.zpl`, result.zplContent);
                            updateLabelDownloadStatus(result.id, {
                              downloaded: result.downloaded,
                              downloadCount: result.downloadCount,
                              lastDownloadedAt: result.lastDownloadedAt,
                            });
                            await queryClient.invalidateQueries({ queryKey: ['labels'] });
                          } catch {
                            setPageError('No fue posible descargar la etiqueta.');
                          }
                        }}
                      >
                        Descargar
                      </Button>
                      <Button
                        size="small"
                        onClick={async () => {
                          const zpl = await getLabelZpl(label.id);
                          printText(`label-${label.id}`, zpl);
                        }}
                      >
                        Imprimir
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          void deleteMutation.mutateAsync(label.id);
                        }}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LabelZplDialog
        open={zplDialog.open}
        labelId={zplDialog.labelId}
        zpl={zplDialog.zpl}
        onDownload={async () => {
          if (!zplDialog.labelId) {
            return;
          }

          try {
            const result = await downloadLabelZplWithMeta(zplDialog.labelId);
            downloadTextFile(`label-${zplDialog.labelId}.zpl`, result.zplContent);
            updateLabelDownloadStatus(zplDialog.labelId, {
              downloaded: result.downloaded,
              downloadCount: result.downloadCount,
              lastDownloadedAt: result.lastDownloadedAt,
            });
            await queryClient.invalidateQueries({ queryKey: ['labels'] });
          } catch {
            setPageError('No fue posible descargar la etiqueta.');
          }
        }}
        onClose={() => setZplDialog({ open: false, labelId: null, zpl: '' })}
      />
    </PageSection>
  );
}
