/**
 * MedLedger — Core Error Types
 *
 * Defines the ActionResult<T> pattern and error codes used across all modules.
 *
 * Server Actions return typed results — never throw for expected errors.
 * Thrown exceptions are reserved for truly unexpected failures.
 */

/**
 * Standard error codes used throughout the application.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE_VIOLATION'
  | 'INSUFFICIENT_STOCK'
  | 'INTERNAL_ERROR';

/**
 * Structured error returned to the client.
 * Never includes stack traces or internal implementation details.
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  /** Field-level validation errors (field name → error messages). */
  fields?: Record<string, string[]>;
}

/**
 * Standard result type for all Server Actions.
 *
 * Usage:
 * ```ts
 * const result = await createPatient(data);
 * if (result.success) {
 *   // result.data is typed
 * } else {
 *   // result.error.code, result.error.message, result.error.fields
 * }
 * ```
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };
