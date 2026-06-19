import type { Role } from '../types/api';

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  ASESOR: 'Asesor',
  PICKER: 'Picker',
};

interface RoleBadgeProps {
  role: Role;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span data-testid="role-badge" title={role}>
      {roleLabels[role]}
    </span>
  );
}
