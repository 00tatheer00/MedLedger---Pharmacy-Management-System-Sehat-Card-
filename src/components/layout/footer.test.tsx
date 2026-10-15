import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

describe('Footer Component', () => {
  it('renders brand name, DHQ Kohat affiliation, and dynamic current copyright year', () => {
    render(<Footer />);

    expect(screen.getByText('MedLedger')).toBeDefined();
    expect(screen.getByText('DHQ Hospital Kohat')).toBeDefined();

    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeDefined();
  });

  it('renders essential navigation links including Dashboard, Fast Counter, and Status', () => {
    render(<Footer />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.getAttribute('href')).toBe('/');

    const counterLink = screen.getByRole('link', { name: /fast counter/i });
    expect(counterLink.getAttribute('href')).toBe('/dispensing');

    const statusLink = screen.getByRole('link', { name: /status/i });
    expect(statusLink.getAttribute('href')).toBe('/api/health');
  });
});
