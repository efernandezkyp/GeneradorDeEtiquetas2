import { Box, Button, Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useScanHistory } from '../hooks/useScanHistory';

export function PickerHomePage() {
  const { user, logout } = useAuth();
  const { scannedLabels } = useScanHistory();
  const navigate = useNavigate();

  const latest = scannedLabels.slice(0, 20);

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 2,
          py: 2,
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Panel Picker
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </Typography>
          </Box>
          <Button
            variant="text"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => {
              void logout().then(() => navigate('/login'));
            }}
            sx={{ textTransform: 'none' }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </Box>

      <Box sx={{ px: 2, py: 3 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<CameraAltIcon />}
          onClick={() => navigate('/scan')}
          sx={{ py: 2, fontSize: '1.1rem', borderRadius: 3 }}
        >
          Escanear
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          <HistoryIcon color="action" fontSize="small" />
          <Typography variant="subtitle2" color="text.secondary">
            Últimos escaneos
          </Typography>
        </Stack>

        {latest.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              No hay escaneos registrados
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Escanea tu primera etiqueta para comenzar
            </Typography>
          </Box>
        ) : (
          <List dense>
            {latest.map((r, i) => (
              <ListItem
                key={`${r.labelId}-${i}`}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  mb: 0.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={r.externalReference}
                  secondary={r.scannedAt}
                  slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                />
                <Chip
                  icon={
                    r.alreadyDispatched ? (
                      <ErrorIcon fontSize="small" />
                    ) : (
                      <CheckCircleIcon fontSize="small" />
                    )
                  }
                  label={r.alreadyDispatched ? 'Ya despachada' : 'Despachada'}
                  color={r.alreadyDispatched ? 'warning' : 'success'}
                  size="small"
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
