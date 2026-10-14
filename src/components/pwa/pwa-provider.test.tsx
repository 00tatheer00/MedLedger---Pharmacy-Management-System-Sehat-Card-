import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PWAProvider, usePWA } from './pwa-provider';

function TestConsumer() {
  const { isOnline, isUpdateAvailable } = usePWA();
  return (
    <div>
      <span data-testid="online-status">{isOnline ? 'online' : 'offline'}</span>
      <span data-testid="update-status">{isUpdateAvailable ? 'update-ready' : 'up-to-date'}</span>
    </div>
  );
}

describe('PWAProvider & Update Notification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '0.1.0', timestamp: Date.now() }),
    } as Response);
  });

  it('renders children with default online and up-to-date status', () => {
    render(
      <PWAProvider>
        <TestConsumer />
      </PWAProvider>,
    );

    expect(screen.getByTestId('online-status')).toHaveTextContent('online');
    expect(screen.getByTestId('update-status')).toHaveTextContent('up-to-date');
    expect(screen.queryByText('New Version Available')).not.toBeInTheDocument();
  });

  it('displays New Version Available notification when update event is fired', () => {
    render(
      <PWAProvider>
        <TestConsumer />
      </PWAProvider>,
    );

    act(() => {
      window.dispatchEvent(new CustomEvent('medledger:update-available'));
    });

    expect(screen.getByText('New Version Available')).toBeInTheDocument();
    expect(
      screen.getByText('A new update is available. Refresh to load the latest changes.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update now/i })).toBeInTheDocument();
  });

  it('allows dismissing the New Version Available notification', () => {
    render(
      <PWAProvider>
        <TestConsumer />
      </PWAProvider>,
    );

    act(() => {
      window.dispatchEvent(new CustomEvent('medledger:update-available'));
    });

    expect(screen.getByText('New Version Available')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close update notification/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('New Version Available')).not.toBeInTheDocument();
  });
});
