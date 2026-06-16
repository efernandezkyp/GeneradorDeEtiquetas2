import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ZplPreview } from './ZplPreview';

describe('ZplPreview', () => {
  it('renderiza el contenido zpl recibido', () => {
    render(<ZplPreview content="^XA^FDTEST^XZ" />);

    expect(screen.getByTestId('zpl-preview')).toHaveTextContent('^XA^FDTEST^XZ');
  });
});
