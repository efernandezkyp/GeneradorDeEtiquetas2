import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { getGoogleAuthUrl } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { loginSchema, type LoginFormValues } from '../schemas/authSchemas';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setErrorMessage(null);
      await login(values);
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        setErrorMessage('No se pudo conectar al backend. Verifica VITE_API_URL y CORS_ORIGIN.');
        return;
      }
      setErrorMessage('No fue posible iniciar sesion con las credenciales indicadas.');
    }
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, backgroundColor: '#eff6ff' }}>
      <Card sx={{ width: '100%', maxWidth: 520, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} component="form" onSubmit={onSubmit}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Sistema Multiempresa de Etiquetas ZPL
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Accede con email y contrasena o mediante OAuth con Google.
              </Typography>
            </Box>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              label="Email"
              type="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Contrasena"
              type="password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
                Ingresar
              </Button>
              <Button
                type="button"
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => {
                  window.location.href = getGoogleAuthUrl();
                }}
              >
                Ingresar con Google
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
