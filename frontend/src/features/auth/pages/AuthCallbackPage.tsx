import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function completeLogin() {
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      if (!accessToken || !refreshToken) {
        setErrorMessage('No se recibieron tokens validos desde el backend.');
        return;
      }

      try {
        await completeGoogleLogin(accessToken, refreshToken);
        navigate('/');
      } catch {
        setErrorMessage('No fue posible completar el inicio de sesion con Google.');
      }
    }

    void completeLogin();
  }, [completeGoogleLogin, navigate, params]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 480 }}>
        {errorMessage ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        ) : (
          <>
            <CircularProgress />
            <Typography variant="h6">Procesando autenticacion con Google...</Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}
