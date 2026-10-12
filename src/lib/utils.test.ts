import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional class names', () => {
    const isPrimary = true;
    const isSecondary = false;
    expect(cn('btn', isPrimary && 'btn-primary', isSecondary && 'btn-secondary')).toBe(
      'btn btn-primary',
    );
  });

  it('resolves conflicting Tailwind CSS classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles undefined, null, and empty string arguments gracefully', () => {
    expect(cn('btn', undefined, null, '')).toBe('btn');
  });
});
