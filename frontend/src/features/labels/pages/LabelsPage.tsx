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
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection } from '../../../shared/components/PageSection';
import type { Label } from '../../../shared/types/api';
import { downloadTextFile, printText } from '../../../shared/utils/fileActions';
import { LabelZplDialog } from '../components/LabelZplDialog';
import {
  deleteLabel,
  downloadLabelZpl,
  duplicateLabel,
  getLabelZpl,
  listLabels,
  type LabelFiltersState,
} from '../api/labelsApi';

export function LabelsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      const zplFiles = await Promise.all(
        selectedRows.map(async (label) => ({
          ...label,
          zpl: await downloadLabelZpl(label.id, true),
        })),
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadTextFile(`labels-zpl-${timestamp}.txt`, buildBulkZplContent(zplFiles));
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    } catch {
      setPageError('No fue posible descargar el archivo TXT con las etiquetas seleccionadas.');
    }
  };

  return (
    <PageSection
      title="Etiquetas"
      subtitle="Creacion, edicion, duplicado, descarga e impresion de etiquetas ZPL"
      actions={
        <Button
          variant="contained"
          onClick={() => {
            navigate('/labels/new');
          }}
        >
          Nueva etiqueta
        </Button>
      }
    >
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}
      {labelsQuery.isError ? <Alert severity="error">No fue posible cargar las etiquetas.</Alert> : null}

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
                    inputProps={{ 'aria-label': 'Seleccionar todas las etiquetas' }}
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
                      inputProps={{ 'aria-label': `Seleccionar etiqueta ${label.externalReference}` }}
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
                          const zpl = await downloadLabelZpl(label.id);
                          downloadTextFile(`label-${label.id}.zpl`, zpl);
                          await queryClient.invalidateQueries({ queryKey: ['labels'] });
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

          const zpl = await downloadLabelZpl(zplDialog.labelId);
          downloadTextFile(`label-${zplDialog.labelId}.zpl`, zpl);
          await queryClient.invalidateQueries({ queryKey: ['labels'] });
        }}
        onClose={() => setZplDialog({ open: false, labelId: null, zpl: '' })}
      />
    </PageSection>
  );
}
