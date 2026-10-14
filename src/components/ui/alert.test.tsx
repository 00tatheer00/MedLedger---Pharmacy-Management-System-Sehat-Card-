import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './alert';

describe('Alert component', () => {
  it('renders title and description', () => {
    render(
      <Alert variant="warning" title="Stock Warning" description="Amoxicillin below threshold" />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Stock Warning')).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin below threshold')).toBeInTheDocument();
  });

  it('renders critical variant with danger styling', () => {
    render(<Alert variant="critical" title="Expired Medicine" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('border-danger/30');
  });
});
