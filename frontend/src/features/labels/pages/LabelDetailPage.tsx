import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageSection } from '../../../shared/components/PageSection';
import type { LabelDetail, PaginatedLabels } from '../../../shared/types/api';
import { downloadTextFile } from '../../../shared/utils/fileActions';
import { LabelZplDialog } from '../components/LabelZplDialog';
import { downloadLabelZplWithMeta, getLabelDetail, getLabelZpl } from '../api/labelsApi';
import { parseLabelProducts } from '../utils/products';

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}

function translateAction(action: string): string {
  switch (action) {
    case 'CREATE':
      return 'Creación';
    case 'UPDATE':
      return 'Modificación';
    case 'DELETE':
      return 'Eliminación';
    case 'DOWNLOAD':
      return 'Descarga';
    default:
      return action;
  }
}

export function LabelDetailPage() {
  const { labelId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageError, setPageError] = useState<string | null>(null);
  const [zplDialog, setZplDialog] = useState<{ open: boolean; zpl: string }>({ open: false, zpl: '' });

  const detailQuery = useQuery({
    queryKey: ['label-detail', labelId],
    queryFn: () => getLabelDetail(labelId!),
    enabled: Boolean(labelId),
  });

  if (detailQuery.isLoading) {
    return (
      <PageSection title="Etiqueta" subtitle="Cargando detalle">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </PageSection>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <PageSection title="Etiqueta" subtitle="No fue posible cargar el detalle">
        <Alert severity="error">No fue posible cargar el detalle de la etiqueta.</Alert>
      </PageSection>
    );
  }

  const { label, history } = detailQuery.data;
  const products = parseLabelProducts(label);

  return (
    <PageSection
      title={`Etiqueta ${label.externalReference}`}
      subtitle="Detalle actual e historial completo de la etiqueta"
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/labels')}>Volver</Button>
          <Button
            onClick={async () => {
              const zpl = await getLabelZpl(label.id);
              setZplDialog({ open: true, zpl });
            }}
          >
            Ver ZPL
          </Button>
          <Button
            onClick={() => {
              navigate(`/labels/${label.id}/edit`);
            }}
          >
            Editar
          </Button>
        </Stack>
      }
    >
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2">Referencia externa</Typography>
              <Typography>{label.externalReference}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2">Motivo</Typography>
              <Typography>{label.reason}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2">Estado de descarga</Typography>
              <Chip
                size="small"
                color={label.downloaded ? 'success' : 'default'}
                label={label.downloaded ? `Descargada${label.downloadCount ? ` (${label.downloadCount})` : ''}` : 'Pendiente'}
                variant={label.downloaded ? 'filled' : 'outlined'}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2">Destinatario</Typography>
              <Typography>{label.receiver}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2">Teléfono</Typography>
              <Typography>{label.phone}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2">Destino</Typography>
              <Typography>{label.destinationCompany}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Empresa origen</Typography>
              <Typography>{label.originCompany}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Última descarga</Typography>
              <Typography>{formatDateTime(label.lastDownloadedAt)}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2">Dirección</Typography>
              <Typography>{label.address}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Creada</Typography>
              <Typography>{formatDateTime(label.createdAt)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Actualizada</Typography>
              <Typography>{formatDateTime(label.updatedAt)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Productos
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cantidad</TableCell>
                <TableCell>Nombre</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={`${product.productName}-${index}`}>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{product.productName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Historial
          </Typography>
          {history.length === 0 ? (
            <Alert severity="info">No hay movimientos registrados para esta etiqueta.</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha y hora</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography>{entry.userName}</Typography>
                        {entry.userEmail ? (
                          <Typography variant="caption" color="text.secondary">
                            {entry.userEmail}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>{translateAction(entry.action)}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography>{entry.summary}</Typography>
                        {entry.changes.map((change) => (
                          <Typography key={`${entry.id}-${change.field}`} variant="body2" color="text.secondary">
                            {change.label}: "{change.from}" → "{change.to}"
                          </Typography>
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LabelZplDialog
        open={zplDialog.open}
        labelId={label.id}
        zpl={zplDialog.zpl}
        onDownload={async () => {
          try {
            setPageError(null);
            const result = await downloadLabelZplWithMeta(label.id);
            downloadTextFile(`label-${label.id}.zpl`, result.zplContent);

            queryClient.setQueriesData<PaginatedLabels>(
              { queryKey: ['labels'] },
              (oldData) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  labels: oldData.labels.map((l) =>
                    l.id === label.id ? { ...l, downloaded: result.downloaded, downloadCount: result.downloadCount, lastDownloadedAt: result.lastDownloadedAt } : l,
                  ),
                };
              },
            );

            queryClient.setQueryData<LabelDetail>(
              ['label-detail', label.id],
              (oldData) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  label: { ...oldData.label, downloaded: result.downloaded, downloadCount: result.downloadCount, lastDownloadedAt: result.lastDownloadedAt },
                };
              },
            );

            await queryClient.invalidateQueries({ queryKey: ['labels'] });
            await queryClient.invalidateQueries({ queryKey: ['label-detail', label.id] });
          } catch {
            setPageError('No fue posible descargar la etiqueta.');
          }
        }}
        onClose={() => setZplDialog({ open: false, zpl: '' })}
      />
    </PageSection>
  );
}
