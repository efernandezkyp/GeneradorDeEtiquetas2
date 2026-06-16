import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { PageSection } from '../../../shared/components/PageSection';
import { LabelZplDialog } from '../components/LabelZplDialog';
import {
  createLabel,
  getLabel,
  previewLabel,
  updateLabel,
} from '../api/labelsApi';
import { labelSchema, type LabelFormValues } from '../schemas/labelSchemas';
import { parseLabelProducts } from '../utils/products';

function getDefaultValues(): LabelFormValues {
  return {
    externalReference: '',
    reason: '',
    products: [{ productName: '', quantity: 1 }],
    address: '',
    phone: '',
    receiver: '',
  };
}

function normalizeValues(values: LabelFormValues): LabelFormValues {
  return {
    ...values,
    externalReference: values.externalReference.trim(),
    reason: values.reason.trim(),
    address: values.address.trim(),
    phone: values.phone.trim(),
    receiver: values.receiver.trim(),
    products: values.products.map((product) => ({
      productName: product.productName.trim(),
      quantity: Number(product.quantity),
    })),
  };
}

export function LabelEditorPage() {
  const { labelId } = useParams();
  const isEditing = Boolean(labelId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageError, setPageError] = useState<string | null>(null);
  const [zplDialog, setZplDialog] = useState<{ open: boolean; zpl: string }>({ open: false, zpl: '' });

  const form = useForm<LabelFormValues>({
    resolver: zodResolver(labelSchema),
    defaultValues: getDefaultValues(),
  });

  const productsFieldArray = useFieldArray({
    control: form.control,
    name: 'products',
  });

  const labelQuery = useQuery({
    queryKey: ['label', labelId],
    queryFn: () => getLabel(labelId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!labelQuery.data) {
      if (!isEditing) {
        form.reset(getDefaultValues());
      }
      return;
    }

    form.reset({
      externalReference: labelQuery.data.externalReference,
      reason: labelQuery.data.reason,
      products: parseLabelProducts(labelQuery.data),
      address: labelQuery.data.address,
      phone: labelQuery.data.phone,
      receiver: labelQuery.data.receiver,
    });
  }, [form, isEditing, labelQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: LabelFormValues) => {
      const normalized = normalizeValues(values);
      return isEditing && labelId ? updateLabel(labelId, normalized) : createLabel(normalized);
    },
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (labelId) {
        await queryClient.invalidateQueries({ queryKey: ['label', labelId] });
      }
      navigate('/labels');
    },
    onError: () => {
      setPageError('No fue posible guardar la etiqueta.');
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (values: LabelFormValues) => previewLabel(normalizeValues(values)),
    onSuccess: (zpl) => {
      setPageError(null);
      setZplDialog({ open: true, zpl });
    },
    onError: () => {
      setPageError('No fue posible generar la vista previa.');
    },
  });

  const productCount = form.watch('products').length;

  if (labelQuery.isLoading) {
    return (
      <PageSection title="Etiquetas" subtitle="Cargando etiqueta">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </PageSection>
    );
  }

  if (labelQuery.isError) {
    return (
      <PageSection title="Etiquetas" subtitle="No fue posible cargar la etiqueta">
        <Alert severity="error">No fue posible cargar la etiqueta seleccionada.</Alert>
      </PageSection>
    );
  }

  return (
    <PageSection
      title={isEditing ? 'Editar etiqueta' : 'Nueva etiqueta'}
      subtitle="Carga de referencia, multiples productos y generacion de ZPL"
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/labels')}>Volver</Button>
          <Button
            onClick={form.handleSubmit(async (values) => {
              await previewMutation.mutateAsync(values);
            })}
          >
            Vista previa
          </Button>
          <Button
            variant="contained"
            disabled={saveMutation.isPending}
            onClick={form.handleSubmit(async (values) => {
              await saveMutation.mutateAsync(values);
            })}
          >
            Guardar
          </Button>
        </Stack>
      }
    >
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Referencia externa"
                fullWidth
                error={Boolean(form.formState.errors.externalReference)}
                helperText={form.formState.errors.externalReference?.message}
                {...form.register('externalReference')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Motivo"
                fullWidth
                error={Boolean(form.formState.errors.reason)}
                helperText={form.formState.errors.reason?.message}
                {...form.register('reason')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Direccion"
                fullWidth
                multiline
                rows={3}
                error={Boolean(form.formState.errors.address)}
                helperText={form.formState.errors.address?.message}
                {...form.register('address')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Telefono"
                fullWidth
                error={Boolean(form.formState.errors.phone)}
                helperText={form.formState.errors.phone?.message}
                {...form.register('phone')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Destinatario"
                fullWidth
                error={Boolean(form.formState.errors.receiver)}
                helperText={form.formState.errors.receiver?.message}
                {...form.register('receiver')}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
          >
            <Box>
              <Typography variant="h6">Productos</Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega una fila por cada producto. La etiqueta ajusta las posiciones automaticamente.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => productsFieldArray.append({ productName: '', quantity: 1 })}
            >
              Agregar producto
            </Button>
          </Stack>

          <Stack spacing={2}>
            {productsFieldArray.fields.map((field, index) => (
              <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <TextField
                    label={`Nombre del producto ${index + 1}`}
                    fullWidth
                    error={Boolean(form.formState.errors.products?.[index]?.productName)}
                    helperText={form.formState.errors.products?.[index]?.productName?.message}
                    {...form.register(`products.${index}.productName`)}
                  />
                </Grid>
                <Grid size={{ xs: 10, md: 3 }}>
                  <TextField
                    label="Cantidad"
                    type="number"
                    fullWidth
                    error={Boolean(form.formState.errors.products?.[index]?.quantity)}
                    helperText={form.formState.errors.products?.[index]?.quantity?.message}
                    {...form.register(`products.${index}.quantity`, { valueAsNumber: true })}
                  />
                </Grid>
                <Grid size={{ xs: 2, md: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                    <IconButton
                      aria-label={`Eliminar producto ${index + 1}`}
                      disabled={productCount === 1}
                      onClick={() => productsFieldArray.remove(index)}
                    >
                      x
                    </IconButton>
                  </Stack>
                </Grid>
              </Grid>
            ))}
          </Stack>

          {typeof form.formState.errors.products?.message === 'string' ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {form.formState.errors.products.message}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <LabelZplDialog
        open={zplDialog.open}
        labelId={labelId ?? null}
        zpl={zplDialog.zpl}
        onClose={() => setZplDialog({ open: false, zpl: '' })}
      />
    </PageSection>
  );
}
