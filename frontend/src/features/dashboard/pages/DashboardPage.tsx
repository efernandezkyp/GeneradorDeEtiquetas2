import { Alert, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { PageSection } from '../../../shared/components/PageSection';
import { StatCard } from '../../../shared/components/StatCard';
import { getDashboardStats } from '../api/dashboardApi';

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  });

  return (
    <PageSection
      title="Dashboard"
      subtitle="Visibilidad de etiquetas, usuarios y empresas segun el rol autenticado"
    >
      {dashboardQuery.isError ? <Alert severity="error">No fue posible cargar el dashboard.</Alert> : null}

      <Grid container spacing={3}>
        {dashboardQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, md: 6, xl: 3 }}>
                <Skeleton variant="rounded" height={150} />
              </Grid>
            ))
          : null}

        {dashboardQuery.data ? (
          <>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <StatCard
                title="Total etiquetas"
                value={dashboardQuery.data.totalLabels}
                helperText="Cantidad acumulada registrada"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <StatCard
                title="Etiquetas del mes"
                value={dashboardQuery.data.labelsThisMonth}
                helperText="Actividad del periodo actual"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <StatCard
                title="Usuarios activos"
                value={dashboardQuery.data.activeUsers}
                helperText="Usuarios habilitados para operar"
              />
            </Grid>
            {typeof dashboardQuery.data.activeCompanies === 'number' ? (
              <Grid size={{ xs: 12, md: 6, xl: 3 }}>
                <StatCard
                  title="Empresas activas"
                  value={dashboardQuery.data.activeCompanies}
                  helperText="Disponible solo para super admin"
                />
              </Grid>
            ) : null}
          </>
        ) : null}
      </Grid>

      <Stack spacing={1}>
        <Typography variant="h6">Resumen operativo</Typography>
        <Typography color="text.secondary">
          Usa los modulos laterales para administrar empresas, usuarios y etiquetas con
          aislamiento por compania.
        </Typography>
      </Stack>
    </PageSection>
  );
}
