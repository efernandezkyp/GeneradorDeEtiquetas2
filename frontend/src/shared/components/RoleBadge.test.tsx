import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoleBadge } from './RoleBadge';

describe('RoleBadge', () => {
  it('traduce el rol a una etiqueta legible', () => {
    render(<RoleBadge role="SUPER_ADMIN" />);

    expect(screen.getByTestId('role-badge')).toHaveTextContent('Super Admin');
    expect(screen.getByTestId('role-badge')).toHaveAttribute('title', 'SUPER_ADMIN');
  });
});
