import {
  Box,
  Button,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useScanHistory } from '../hooks/useScanHistory';
import { getPendingDispatchLabels } from '../api/pickerApi';

export function PickerHomePage() {
  const { user, logout } = useAuth();
  const { scannedLabels } = useScanHistory();
  const navigate = useNavigate();
  const [showPending, setShowPending] = useState(false);

  const latest = scannedLabels.slice(0, 20);

  const pendingQuery = useQuery({
    queryKey: ['pending-dispatch'],
    queryFn: getPendingDispatchLabels,
    refetchInterval: 30_000,
  });

  const pendingTotal = pendingQuery.data?.total ?? 0;
  const pendingLabels = pendingQuery.data?.labels ?? [];

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

      <Box sx={{ px: 2, py: 3, pb: 1 }}>
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

      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          onClick={() => {
            if (pendingTotal > 0) setShowPending((prev) => !prev);
          }}
          sx={{
            bgcolor: pendingTotal > 0 ? 'warning.light' : 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: pendingTotal > 0 ? 'warning.main' : 'divider',
            p: 2,
            cursor: pendingTotal > 0 ? 'pointer' : 'default',
            transition: 'all 0.2s',
            '&:hover': pendingTotal > 0
              ? { bgcolor: 'warning.light', opacity: 0.85 }
              : {},
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <InventoryIcon color={pendingTotal > 0 ? 'warning' : 'disabled'} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pendientes de despacho
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {pendingQuery.isLoading ? '-' : pendingTotal}
                </Typography>
              </Box>
            </Stack>
            {pendingTotal > 0 && (
              <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {showPending ? 'Cerrar' : 'Ver'}
                </Typography>
                {showPending ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Stack>
            )}
          </Stack>
        </Box>

        <Collapse in={showPending && pendingLabels.length > 0}>
          <Box
            sx={{
              mt: 1,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            <List dense disablePadding>
              {pendingLabels.map((label) => (
                <ListItem
                  key={label.id}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 1.5,
                    px: 2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {label.externalReference}
                  </Typography>
                  <Stack spacing={0.25} sx={{ mt: 0.5, width: '100%' }}>
                    {label.products.map((product, idx) => (
                      <Typography
                        key={`${label.id}-${idx}`}
                        variant="body2"
                        color="text.secondary"
                      >
                        {product.quantity} x {product.productName}
                      </Typography>
                    ))}
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
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
