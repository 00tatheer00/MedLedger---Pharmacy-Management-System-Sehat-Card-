import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Schema & Migration Validation', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');

  const EXPECTED_28_TABLES = [
    'profiles',
    'roles',
    'user_roles',
    'permissions',
    'role_permissions',
    'patients',
    'admissions',
    'medicines',
    'medicine_batches',
    'stock_movements',
    'prescriptions',
    'prescription_items',
    'dispensing_records',
    'dispensing_items',
    'suppliers',
    'purchase_orders',
    'purchase_order_items',
    'goods_receipts',
    'goods_receipt_items',
    'supplier_invoices',
    'supplier_payments',
    'claims',
    'claim_items',
    'claim_approvals',
    'claim_payments',
    'audit_events',
    'notifications',
    'system_config',
  ];

  it('verifies all 4 ordered migration files exist in supabase/migrations/', () => {
    const files = fs.readdirSync(migrationsDir);
    expect(files).toContain('20261013000001_core_schema.sql');
    expect(files).toContain('20261013000002_rls_policies.sql');
    expect(files).toContain('20261013000003_audit_triggers.sql');
    expect(files).toContain('20261013000004_seed_dev_data.sql');
  });

  it('verifies all 28 tables are defined in 20261013000001_core_schema.sql', () => {
    const schemaSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000001_core_schema.sql'),
      'utf-8',
    );

    EXPECTED_28_TABLES.forEach((table) => {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, 'i');
      expect(schemaSql).toMatch(tableRegex);
    });
  });

  it('verifies Row Level Security is enabled on all 28 tables in 20261013000002_rls_policies.sql', () => {
    const rlsSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000002_rls_policies.sql'),
      'utf-8',
    );

    EXPECTED_28_TABLES.forEach((table) => {
      const rlsRegex = new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i');
      expect(rlsSql).toMatch(rlsRegex);
    });
  });

  it('verifies soft-delete partial unique indexes exist for re-registration safety', () => {
    const schemaSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000001_core_schema.sql'),
      'utf-8',
    );

    expect(schemaSql).toContain(
      'idx_patients_mr_number ON patients(mr_number) WHERE deleted_at IS NULL',
    );
    expect(schemaSql).toContain(
      'idx_admissions_number ON admissions(admission_number) WHERE deleted_at IS NULL',
    );
    expect(schemaSql).toContain(
      'idx_prescriptions_number ON prescriptions(prescription_number) WHERE deleted_at IS NULL',
    );
    expect(schemaSql).toContain(
      'idx_dispensing_number ON dispensing_records(dispensing_number) WHERE deleted_at IS NULL',
    );
    expect(schemaSql).toContain(
      'idx_suppliers_ntn ON suppliers(ntn_number) WHERE deleted_at IS NULL',
    );
    expect(schemaSql).toContain(
      'idx_po_number ON purchase_orders(po_number) WHERE deleted_at IS NULL',
    );
    expect(schemaSql).toContain(
      'idx_claims_number ON claims(claim_number) WHERE deleted_at IS NULL',
    );
  });

  it('verifies medicine substitution and claim reconciliation FK design requirements', () => {
    const schemaSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000001_core_schema.sql'),
      'utf-8',
    );

    // Substitution auditability: dispensing_items must track dispensed_medicine_id
    expect(schemaSql).toContain('dispensed_medicine_id UUID NOT NULL REFERENCES medicines(id)');

    // Granular claim auditability: claim_items must track dispensing_item_id
    expect(schemaSql).toContain('dispensing_item_id UUID NOT NULL REFERENCES dispensing_items(id)');
  });

  it('verifies immutability trigger protects audit_events in 20261013000003_audit_triggers.sql', () => {
    const triggersSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000003_audit_triggers.sql'),
      'utf-8',
    );

    expect(triggersSql).toContain('CREATE OR REPLACE FUNCTION prevent_audit_tampering()');
    expect(triggersSql).toContain('BEFORE UPDATE OR DELETE ON audit_events');
  });

  it('verifies atomic dispensing and reversal RPCs exist in 20261013000005_dispensing_rpc.sql', () => {
    const rpcSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000005_dispensing_rpc.sql'),
      'utf-8',
    );

    expect(rpcSql).toContain('CREATE OR REPLACE FUNCTION fn_dispense_prescription_atomic');
    expect(rpcSql).toContain('CREATE OR REPLACE FUNCTION fn_reverse_dispensing_atomic');
    expect(rpcSql).toContain('FOR UPDATE');
  });

  it('verifies atomic claims creation, review, and payment RPCs exist in 20261013000006_claims_rpc.sql', () => {
    const rpcSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000006_claims_rpc.sql'),
      'utf-8',
    );

    expect(rpcSql).toContain('CREATE OR REPLACE FUNCTION fn_create_claim_atomic');
    expect(rpcSql).toContain('CREATE OR REPLACE FUNCTION fn_review_claim_atomic');
    expect(rpcSql).toContain('CREATE OR REPLACE FUNCTION fn_record_claim_payment_atomic');
    expect(rpcSql).toContain('FOR UPDATE');
  });

  it('verifies atomic supplier payment recording and reconciliation RPC in 20261013000007_finance_reconciliation_rpc.sql', () => {
    const rpcSql = fs.readFileSync(
      path.join(migrationsDir, '20261013000007_finance_reconciliation_rpc.sql'),
      'utf-8',
    );

    expect(rpcSql).toContain('CREATE TABLE IF NOT EXISTS supplier_payment_allocations');
    expect(rpcSql).toContain('CREATE OR REPLACE FUNCTION fn_record_supplier_payment_atomic');
    expect(rpcSql).toContain('v_financial_reconciliation');
    expect(rpcSql).toContain('FOR UPDATE');
  });
});
