import { Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number;
  helperText: string;
}

export function StatCard({ title, value, helperText }: StatCardProps) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2">{title}</Typography>
        <Typography variant="h4" sx={{ my: 1.5, fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography color="text.secondary" variant="body2">{helperText}</Typography>
      </CardContent>
    </Card>
  );
}
