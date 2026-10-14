import { createServerClient } from '../database/client';
import { Json } from '../database/schema-types';
import { isSupabaseConfigured } from '../config/env';

export interface AuditEventParams {
  eventType: string; // e.g. 'dispensing:create', 'inventory:adjust', 'auth:login'
  entityType: string; // e.g. 'dispensing_records', 'medicine_batches', 'claims'
  entityId: string;
  userId?: string | null;
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'dispense'
    | 'adjust'
    | 'approve'
    | 'reject'
    | 'login'
    | 'logout'
    | 'reconcile'
    | 'export';
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'api_key',
  'auth_secret',
  'pin',
  'bearer',
  'service_role',
]);

/**
 * Sanitizes audit payload by recursively stripping sensitive keys (passwords, tokens, secrets).
 */
export function sanitizeAuditData(data: Record<string, unknown> | null | undefined): Json | null {
  if (!data || typeof data !== 'object') return null;

  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      sanitized[key] = sanitizeAuditData(val as Record<string, unknown>);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized as Json;
}

/**
 * Records an immutable operational audit event.
 * If Supabase is unconfigured, logs safely to console without breaking prototype flow.
 */
export async function logAuditEvent(
  params: AuditEventParams,
): Promise<{ success: boolean; id?: string }> {
  const sanitizedOld = sanitizeAuditData(params.oldValues);
  const sanitizedNew = sanitizeAuditData(params.newValues);

  try {
    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[Audit Log — Prototype Mode]', {
          eventType: params.eventType,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
        });
      }
      return { success: true, id: `proto-audit-${Date.now()}` };
    }

    const supabase = await createServerClient();

    if (!supabase) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[Audit Log — Development]', {
          eventType: params.eventType,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
        });
      }
      return { success: true };
    }

    const { data, error } = await supabase
      .from('audit_events')
      .insert({
        event_type: params.eventType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        user_id: params.userId || null,
        action: params.action,
        old_values: sanitizedOld,
        new_values: sanitizedNew,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Audit event database write failed:', error.message);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Audit logging unexpected exception:', error);
    return { success: false };
  }
}

export const auditLogger = {
  log: logAuditEvent,
};
