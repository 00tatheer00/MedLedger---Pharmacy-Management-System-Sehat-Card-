import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UpdatePrompt } from './update-prompt';

describe('UpdatePrompt Component', () => {
  it('renders title, description and action buttons', () => {
    const handleUpdate = vi.fn();
    const handleDismiss = vi.fn();

    render(<UpdatePrompt onUpdate={handleUpdate} onDismiss={handleDismiss} />);

    expect(screen.getByText('New Version Available')).toBeInTheDocument();
    expect(
      screen.getByText('A new update is available. Refresh to load the latest changes.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close update notification/i })).toBeInTheDocument();
  });

  it('triggers onUpdate callback when Update Now is clicked', () => {
    const handleUpdate = vi.fn();
    const handleDismiss = vi.fn();

    render(<UpdatePrompt onUpdate={handleUpdate} onDismiss={handleDismiss} />);

    const updateBtn = screen.getByRole('button', { name: /update now/i });
    fireEvent.click(updateBtn);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('triggers onDismiss callback when close button is clicked', () => {
    const handleUpdate = vi.fn();
    const handleDismiss = vi.fn();

    render(<UpdatePrompt onUpdate={handleUpdate} onDismiss={handleDismiss} />);

    const closeBtn = screen.getByRole('button', { name: /close update notification/i });
    fireEvent.click(closeBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
