import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './header';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
}));

describe('Header Component', () => {
  it('renders title, subtitle, and search trigger', () => {
    render(
      <Header
        onToggleMobileMenu={vi.fn()}
        title="Pharmacy Operations Dashboard"
        subtitle="DHQ Hospital Kohat"
      />,
    );

    expect(screen.getByText('Pharmacy Operations Dashboard')).toBeInTheDocument();
    expect(screen.getByText('DHQ Hospital Kohat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search medicines/i)).toBeInTheDocument();
  });

  it('opens and closes notifications panel on click', () => {
    render(<Header onToggleMobileMenu={vi.fn()} />);

    const notifBtn = screen.getByRole('button', { name: /open notifications/i });
    fireEvent.click(notifBtn);

    expect(screen.getByText('System Alerts')).toBeInTheDocument();

    const closeBtn = screen.getByText('Close panel');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('System Alerts')).not.toBeInTheDocument();
  });

  it('opens user profile menu with provisional role preview switcher', () => {
    render(<Header onToggleMobileMenu={vi.fn()} />);

    const userMenuBtn = screen.getByRole('button', { name: /user profile and role menu/i });
    fireEvent.click(userMenuBtn);

    expect(screen.getByText('Simulated Role Preview')).toBeInTheDocument();
    expect(screen.getByText('ayesha.khan@dhqkohat.test')).toBeInTheDocument();
    expect(screen.getByText('Staff Pharmacist')).toBeInTheDocument();
  });

  it('opens search palette and shows quick actions and categories', () => {
    render(<Header onToggleMobileMenu={vi.fn()} />);

    const searchTrigger = screen.getByRole('button', { name: /search shortcut/i });
    act(() => {
      fireEvent.click(searchTrigger);
    });

    expect(screen.getByText(/popular searches/i)).toBeInTheDocument();
    expect(screen.getByText(/dispense medicine/i)).toBeInTheDocument();
    expect(screen.getByText(/all \(تمام\)/i)).toBeInTheDocument();
  });
});
