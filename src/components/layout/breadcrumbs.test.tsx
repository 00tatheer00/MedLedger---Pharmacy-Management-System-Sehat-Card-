import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs Component', () => {
  it('renders breadcrumb items and current page label', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Inventory', href: '/inventory' },
          { label: 'Batches', current: true },
        ]}
      />,
    );

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toHaveAttribute('aria-current', 'page');
  });
});
