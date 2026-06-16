import {
  AppBar,
  Box,
  Button,
  Chip,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { RoleBadge } from '../../shared/components/RoleBadge';
import type { Role } from '../../shared/types/api';

const drawerWidth = 260;

interface NavItem {
  label: string;
  path: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'] },
  { label: 'Empresas', path: '/companies', roles: ['SUPER_ADMIN'] },
  { label: 'Usuarios', path: '/users', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Etiquetas', path: '/labels', roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = useMemo(
    () => navItems.filter((item) => (user ? item.roles.includes(user.role) : false)),
    [user],
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Etiquetas ZPL
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestion multiempresa
            </Typography>
          </Stack>
        </Toolbar>
        <List sx={{ px: 1 }}>
          {items.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              {user ? (
                <Chip label={<RoleBadge role={user.role} />} color="primary" variant="outlined" />
              ) : null}
              <Button
                variant="outlined"
                onClick={() => {
                  void logout().then(() => navigate('/login'));
                }}
              >
                Cerrar sesion
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
