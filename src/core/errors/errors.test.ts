import { describe, it, expect } from 'vitest';
import { successResult, errorResult, type ActionResult } from './index';

describe('ActionResult error and success pattern', () => {
  it('creates a valid successful result', () => {
    const result: ActionResult<{ id: string }> = successResult({ id: 'med-123' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('med-123');
    }
  });

  it('creates an error result with code and message', () => {
    const result = errorResult('NOT_FOUND', 'Patient record not found');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Patient record not found');
      expect(result.error.fields).toBeUndefined();
    }
  });

  it('creates a validation error result with field-level details', () => {
    const result = errorResult('VALIDATION_ERROR', 'Invalid form data', {
      mrn: ['MRN is required'],
      age: ['Age must be a positive integer'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.fields).toBeDefined();
      expect(result.error.fields?.mrn).toEqual(['MRN is required']);
      expect(result.error.fields?.age).toEqual(['Age must be a positive integer']);
    }
  });
});
