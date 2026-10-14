import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge component', () => {
  it('renders children correctly', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies success variant style', () => {
    render(<Badge variant="success">Passed</Badge>);
    const badge = screen.getByText('Passed');
    expect(badge.className).toContain('text-success');
  });

  it('applies warning variant style', () => {
    render(<Badge variant="warning">Low Stock</Badge>);
    const badge = screen.getByText('Low Stock');
    expect(badge.className).toContain('text-amber-800');
  });
});
