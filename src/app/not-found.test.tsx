import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound 404 Component', () => {
  it('renders 404 header, DHQ Kohat context, and return action buttons', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeDefined();
    expect(screen.getByText(/Page Not Found/i)).toBeDefined();

    const returnBtn = screen.getByRole('link', { name: /Return to Dashboard/i });
    expect(returnBtn.getAttribute('href')).toBe('/');

    const counterBtn = screen.getByRole('link', { name: /Fast Counter/i });
    expect(counterBtn.getAttribute('href')).toBe('/dispensing');
  });
});
