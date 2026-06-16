import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageSection } from '../../../shared/components/PageSection';
import { httpClient } from '../../../shared/api/httpClient';
import type { ApiResponse, Company } from '../../../shared/types/api';

const companySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  code: z
    .string()
    .min(2, 'El codigo es obligatorio')
    .max(20, 'Maximo 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Usa solo mayusculas, numeros y guion bajo'),
  defaultOriginCompany: z.string().min(1, 'Empresa origen requerida'),
  defaultDestinationCompany: z.string().min(1, 'Empresa destino requerida'),
  active: z.boolean(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

async function listCompanies(): Promise<Company[]> {
  const response = await httpClient.get<ApiResponse<Company[]>>('/companies');
  return response.data.data;
}

async function createCompany(payload: CompanyFormValues): Promise<Company> {
  const response = await httpClient.post<ApiResponse<Company>>('/companies', payload);
  return response.data.data;
}

async function updateCompany(id: string, payload: CompanyFormValues): Promise<Company> {
  const response = await httpClient.put<ApiResponse<Company>>(`/companies/${id}`, payload);
  return response.data.data;
}

async function deactivateCompany(id: string): Promise<Company> {
  const response = await httpClient.patch<ApiResponse<Company>>(`/companies/${id}/deactivate`);
  return response.data.data;
}

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: listCompanies });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', code: '', defaultOriginCompany: '', defaultDestinationCompany: '', active: true },
  });

  useEffect(() => {
    if (selectedCompany) {
      form.reset({
        name: selectedCompany.name,
        code: selectedCompany.code,
        defaultOriginCompany: selectedCompany.defaultOriginCompany,
        defaultDestinationCompany: selectedCompany.defaultDestinationCompany,
        active: selectedCompany.active,
      });
      return;
    }
    form.reset({ name: '', code: '', defaultOriginCompany: '', defaultDestinationCompany: '', active: true });
  }, [form, selectedCompany]);

  const saveMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) =>
      selectedCompany ? updateCompany(selectedCompany.id, values) : createCompany(values),
    onSuccess: async () => {
      setPageError(null);
      setOpen(false);
      setSelectedCompany(null);
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: () => {
      setPageError('No fue posible guardar la empresa.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateCompany,
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: () => {
      setPageError('No fue posible desactivar la empresa.');
    },
  });

  const sortedCompanies = useMemo(
    () => [...(companiesQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [companiesQuery.data],
  );

  return (
    <PageSection
      title="Empresas"
      subtitle="Alta, modificacion y desactivacion de companias del sistema"
      actions={
        <Button
          variant="contained"
          onClick={() => {
            setSelectedCompany(null);
            setOpen(true);
          }}
        >
          Nueva empresa
        </Button>
      }
    >
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}
      {companiesQuery.isError ? (
        <Alert severity="error">No fue posible cargar el listado de empresas.</Alert>
      ) : null}

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Codigo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCompanies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.code}</TableCell>
                  <TableCell>{company.active ? 'Activa' : 'Inactiva'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedCompany(company);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={!company.active || deactivateMutation.isPending}
                        onClick={() => {
                          void deactivateMutation.mutateAsync(company.id);
                        }}
                      >
                        Desactivar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedCompany ? 'Editar empresa' : 'Nueva empresa'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              error={Boolean(form.formState.errors.name)}
              helperText={form.formState.errors.name?.message}
              {...form.register('name')}
            />
            <TextField
              label="Codigo"
              error={Boolean(form.formState.errors.code)}
              helperText={form.formState.errors.code?.message}
              {...form.register('code')}
            />
            <TextField
              label="Empresa origen (impresion)"
              error={Boolean(form.formState.errors.defaultOriginCompany)}
              helperText={form.formState.errors.defaultOriginCompany?.message}
              {...form.register('defaultOriginCompany')}
            />
            <TextField
              label="Empresa destino (impresion)"
              error={Boolean(form.formState.errors.defaultDestinationCompany)}
              helperText={form.formState.errors.defaultDestinationCompany?.message}
              {...form.register('defaultDestinationCompany')}
            />
            <FormControlLabel
              control={<Switch checked={form.watch('active')} {...form.register('active')} />}
              label="Empresa activa"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setSelectedCompany(null);
            }}
          >
            Cancelar
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
        </DialogActions>
      </Dialog>
    </PageSection>
  );
}
