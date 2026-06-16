import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection } from '../../../shared/components/PageSection';
import { downloadTextFile, printText } from '../../../shared/utils/fileActions';
import { LabelZplDialog } from '../components/LabelZplDialog';
import {
  deleteLabel,
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Referencia</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Creada</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((label) => (
                <TableRow key={label.id} hover>
                  <TableCell>{label.externalReference}</TableCell>
                  <TableCell>{label.reason}</TableCell>
                  <TableCell>{label.destinationCompany}</TableCell>
                  <TableCell>{new Date(label.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
                          const zpl = await getLabelZpl(label.id);
                          downloadTextFile(`label-${label.id}.zpl`, zpl);
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
        onClose={() => setZplDialog({ open: false, labelId: null, zpl: '' })}
      />
    </PageSection>
  );
}
