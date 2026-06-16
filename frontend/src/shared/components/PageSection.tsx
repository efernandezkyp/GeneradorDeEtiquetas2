import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageSectionProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageSection({ title, subtitle, actions, children }: PageSectionProps) {
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle ? <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography> : null}
        </Box>
        {actions}
      </Stack>
      {children}
    </Stack>
  );
}
