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
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../auth/context/AuthContext';
import { httpClient } from '../../../shared/api/httpClient';
import { PageSection } from '../../../shared/components/PageSection';
import type { ApiResponse, Company, Role, User } from '../../../shared/types/api';

const passwordSchema = z
  .string()
  .min(8, 'Minimo 8 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Debe incluir mayuscula, minuscula, numero y caracter especial',
  );

const userSchema = z.object({
  companyId: z.string().min(1, 'La empresa es obligatoria'),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.email('Email invalido'),
  password: passwordSchema.optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'PICKER']),
});

const resetPasswordSchema = z.object({
  password: passwordSchema,
});

type UserFormValues = z.infer<typeof userSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

async function listUsers(): Promise<User[]> {
  const response = await httpClient.get<ApiResponse<User[]>>('/users');
  return response.data.data;
}

async function listCompanies(): Promise<Company[]> {
  const response = await httpClient.get<ApiResponse<Company[]>>('/companies');
  return response.data.data;
}

async function createUser(payload: UserFormValues): Promise<User> {
  const response = await httpClient.post<ApiResponse<User>>('/users', {
    ...payload,
    password: payload.password || undefined,
  });
  return response.data.data;
}

async function updateUser(id: string, payload: UserFormValues): Promise<User> {
  const response = await httpClient.put<ApiResponse<User>>(`/users/${id}`, {
    ...payload,
    password: payload.password || undefined,
  });
  return response.data.data;
}

async function resetUserPassword(id: string, password: string): Promise<void> {
  await httpClient.patch(`/users/${id}/reset-password`, { password });
}

async function deactivateUser(id: string): Promise<User> {
  const response = await httpClient.patch<ApiResponse<User>>(`/users/${id}/deactivate`);
  return response.data.data;
}

function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as { error?: { message?: string } } | undefined;
  return data?.error?.message ?? null;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const companiesQuery = useQuery({
    queryKey: ['companies-for-users'],
    queryFn: listCompanies,
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      companyId: user?.companyId ?? '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'ASESOR',
    },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (selectedUser) {
      form.reset({
        companyId: selectedUser.companyId,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        password: '',
        role: selectedUser.role as UserFormValues['role'],
      });
      return;
    }
    form.reset({
      companyId: user?.companyId ?? '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'ASESOR',
    });
  }, [form, selectedUser, user?.companyId]);

  const saveMutation = useMutation({
    mutationFn: async (values: UserFormValues) =>
      selectedUser ? updateUser(selectedUser.id, values) : createUser(values),
    onSuccess: async () => {
      setOpen(false);
      setSelectedUser(null);
      setPageError(null);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error) ?? 'No fue posible guardar el usuario.');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (values: ResetPasswordValues) => {
      if (!selectedUser) return;
      await resetUserPassword(selectedUser.id, values.password);
    },
    onSuccess: () => {
      setResetOpen(false);
      resetForm.reset({ password: '' });
      setPageError(null);
    },
    onError: () => {
      setPageError('No fue posible resetear la contrasena.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error) ?? 'No fue posible desactivar el usuario.');
    },
  });

  const visibleCompanies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);

  const roleOptions: Role[] =
    user?.role === 'SUPER_ADMIN'
      ? ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'PICKER']
      : ['ADMIN', 'ASESOR', 'PICKER'];

  return (
    <PageSection
      title="Usuarios"
      subtitle="Administracion de usuarios por compania respetando el rol autenticado"
      actions={
        <Button
          variant="contained"
          onClick={() => {
            setSelectedUser(null);
            setOpen(true);
          }}
        >
          Nuevo usuario
        </Button>
      }
    >
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}
      {usersQuery.isError ? <Alert severity="error">No fue posible cargar los usuarios.</Alert> : null}

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(usersQuery.data ?? []).map((currentUser) => (
                <TableRow key={currentUser.id} hover>
                  <TableCell>{`${currentUser.firstName} ${currentUser.lastName}`}</TableCell>
                  <TableCell>{currentUser.email}</TableCell>
                  <TableCell>{currentUser.role}</TableCell>
                  <TableCell>{currentUser.active ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedUser(currentUser);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedUser(currentUser);
                          setResetOpen(true);
                        }}
                      >
                        Reset pass
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={!currentUser.active || deactivateMutation.isPending}
                        onClick={() => {
                          void deactivateMutation.mutateAsync(currentUser.id);
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
        <DialogTitle>{selectedUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {user?.role === 'SUPER_ADMIN' ? (
              <Controller
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <TextField
                    select
                    label="Empresa"
                    value={field.value}
                    onChange={field.onChange}
                    error={Boolean(form.formState.errors.companyId)}
                    helperText={form.formState.errors.companyId?.message}
                  >
                    {visibleCompanies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            ) : (
              <TextField label="Empresa" value={user?.companyId ?? ''} disabled />
            )}
            <TextField
              label="Nombre"
              error={Boolean(form.formState.errors.firstName)}
              helperText={form.formState.errors.firstName?.message}
              {...form.register('firstName')}
            />
            <TextField
              label="Apellido"
              error={Boolean(form.formState.errors.lastName)}
              helperText={form.formState.errors.lastName?.message}
              {...form.register('lastName')}
            />
            <TextField
              label="Email"
              error={Boolean(form.formState.errors.email)}
              helperText={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            <TextField
              label="Contrasena"
              type="password"
              helperText={
                form.formState.errors.password?.message ??
                (selectedUser
                  ? 'Dejala vacia para no cambiarla.'
                  : 'Debe incluir mayuscula, minuscula, numero y caracter especial.')
              }
              error={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <TextField
                  select
                  label="Rol"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(form.formState.errors.role)}
                  helperText={form.formState.errors.role?.message}
                >
                  {roleOptions.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setSelectedUser(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={saveMutation.isPending}
            onClick={form.handleSubmit(async (values) => {
              if (!selectedUser && (!values.password || values.password.trim() === '')) {
                form.setError('password', { type: 'manual', message: 'La contrasena es obligatoria' });
                return;
              }
              if (user?.role !== 'SUPER_ADMIN' && user?.companyId) {
                values.companyId = user.companyId;
              }
              await saveMutation.mutateAsync(values);
            })}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Resetear contrasena</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nueva contrasena"
              type="password"
              error={Boolean(resetForm.formState.errors.password)}
              helperText={resetForm.formState.errors.password?.message}
              {...resetForm.register('password')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={resetMutation.isPending}
            onClick={resetForm.handleSubmit(async (values) => {
              await resetMutation.mutateAsync(values);
            })}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </PageSection>
  );
}
