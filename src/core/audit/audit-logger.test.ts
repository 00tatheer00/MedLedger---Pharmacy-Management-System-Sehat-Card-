import { describe, it, expect } from 'vitest';
import { sanitizeAuditData, logAuditEvent } from './audit-logger';

describe('Audit Logger & Sanitization Engine', () => {
  it('recursively redacts passwords, tokens, API keys, and sensitive credentials', () => {
    const rawPayload = {
      user_id: 'usr-123',
      action: 'login',
      credentials: {
        password: 'SuperSecretPassword123!',
        token: 'eyJhGciOi...',
        api_key: 'sbp_12345',
        pin: '1234',
      },
      metadata: {
        browser: 'Chrome',
        ip: '192.168.1.1',
      },
    };

    const sanitized = sanitizeAuditData(rawPayload) as {
      user_id: string;
      action: string;
      credentials: {
        password: string;
        token: string;
        api_key: string;
        pin: string;
      };
      metadata: {
        browser: string;
        ip: string;
      };
    };

    expect(sanitized.user_id).toBe('usr-123');
    expect(sanitized.action).toBe('login');
    expect(sanitized.credentials.password).toBe('[REDACTED]');
    expect(sanitized.credentials.token).toBe('[REDACTED]');
    expect(sanitized.credentials.api_key).toBe('[REDACTED]');
    expect(sanitized.credentials.pin).toBe('[REDACTED]');
    expect(sanitized.metadata.browser).toBe('Chrome');
    expect(sanitized.metadata.ip).toBe('192.168.1.1');
  });

  it('handles null and undefined payloads safely', () => {
    expect(sanitizeAuditData(null)).toBeNull();
    expect(sanitizeAuditData(undefined)).toBeNull();
  });

  it('logs audit event gracefully when Supabase is in development mode', async () => {
    const result = await logAuditEvent({
      eventType: 'inventory:adjust',
      entityType: 'medicine_batches',
      entityId: 'batch-001',
      action: 'adjust',
      newValues: { quantity_change: 5 },
    });

    expect(result.success).toBe(true);
  });
});
