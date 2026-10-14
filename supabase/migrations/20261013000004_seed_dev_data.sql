-- ==============================================================================
-- MedLedger — Fictional Development Seed Data
-- Migration: 20261013000004_seed_dev_data.sql
-- NOTICE: THIS SCRIPT CONTAINS STRICTLY FICTIONAL PROTOTYPE DATA FOR
-- LOCAL DEVELOPMENT AND DEMO TESTING. NEVER APPLY TO A PRODUCTION DATABASE.
-- ==============================================================================

-- 1. Insert 5 Provisional System Roles
INSERT INTO roles (id, name, description)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'system_admin', 'System Administrator — User management, role assignment, configuration and audit inspection'),
    ('a0000000-0000-0000-0000-000000000002', 'pharmacy_manager', 'Pharmacy Manager — Full clinical, dispensing, inventory management and operational audit access'),
    ('a0000000-0000-0000-0000-000000000003', 'pharmacist', 'Staff Pharmacist — Patient intake, prescription verification, drug dispensing, and stock queries'),
    ('a0000000-0000-0000-0000-000000000004', 'purchasing_staff', 'Purchasing Staff — Supplier directory, purchase order placement, and goods receipt notes (GRN)'),
    ('a0000000-0000-0000-0000-000000000005', 'finance_staff', 'Finance & Billing Staff — Hospital claim compilation, billing audits, invoice and payment tracking')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Standard Granular Permissions
INSERT INTO permissions (id, code, module, description)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'medicines:read', 'medicines', 'View medicine catalogue and strengths'),
    ('b0000000-0000-0000-0000-000000000002', 'medicines:manage', 'medicines', 'Register, update or discontinue catalogue medicines'),
    ('b0000000-0000-0000-0000-000000000003', 'inventory:read', 'inventory', 'View batch quantities and stock health'),
    ('b0000000-0000-0000-0000-000000000004', 'inventory:adjust', 'inventory', 'Record inventory adjustment or expired stock write-offs'),
    ('b0000000-0000-0000-0000-000000000005', 'patients:read', 'patients', 'Look up patient records and hospital admissions'),
    ('b0000000-0000-0000-0000-000000000006', 'patients:manage', 'patients', 'Register or update patient demographic details'),
    ('b0000000-0000-0000-0000-000000000007', 'prescriptions:read', 'prescriptions', 'View prescriptions and patient orders'),
    ('b0000000-0000-0000-0000-000000000008', 'prescriptions:manage', 'prescriptions', 'Transcribe, update or cancel prescriptions'),
    ('b0000000-0000-0000-0000-000000000009', 'dispensing:read', 'dispensing', 'View dispensing records and counter journals'),
    ('b0000000-0000-0000-0000-000000000010', 'dispensing:create', 'dispensing', 'Execute medicine dispensing and batch deduction'),
    ('b0000000-0000-0000-0000-000000000011', 'suppliers:manage', 'suppliers', 'Manage pharmaceutical suppliers and vendors'),
    ('b0000000-0000-0000-0000-000000000012', 'purchasing:manage', 'purchasing', 'Create purchase orders and record goods receipts'),
    ('b0000000-0000-0000-0000-000000000013', 'claims:read', 'claims', 'View reimbursement claims and itemizations'),
    ('b0000000-0000-0000-0000-000000000014', 'claims:manage', 'claims', 'Draft, submit, approve or reconcile hospital claims'),
    ('b0000000-0000-0000-0000-000000000015', 'audit:read', 'audit', 'Inspect system and clinical audit trails'),
    ('b0000000-0000-0000-0000-000000000016', 'system:manage', 'system', 'Administer user accounts, roles and configurations')
ON CONFLICT (code) DO NOTHING;

-- 3. Assign Permissions to Roles
-- 3.1 System Administrator (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT DO NOTHING;

-- 3.2 Pharmacy Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM permissions
WHERE code IN (
    'medicines:read', 'medicines:manage', 'inventory:read', 'inventory:adjust',
    'patients:read', 'patients:manage', 'prescriptions:read', 'prescriptions:manage',
    'dispensing:read', 'dispensing:create', 'suppliers:manage', 'purchasing:manage',
    'claims:read', 'audit:read'
)
ON CONFLICT DO NOTHING;

-- 3.3 Staff Pharmacist
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM permissions
WHERE code IN (
    'medicines:read', 'inventory:read',
    'patients:read', 'patients:manage', 'prescriptions:read', 'prescriptions:manage',
    'dispensing:read', 'dispensing:create'
)
ON CONFLICT DO NOTHING;

-- 3.4 Purchasing Staff
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000004', id FROM permissions
WHERE code IN (
    'medicines:read', 'inventory:read', 'suppliers:manage', 'purchasing:manage'
)
ON CONFLICT DO NOTHING;

-- 3.5 Finance Staff
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000005', id FROM permissions
WHERE code IN (
    'claims:read', 'claims:manage', 'dispensing:read', 'inventory:read'
)
ON CONFLICT DO NOTHING;

-- 4. Insert Default System Configurations
INSERT INTO system_config (key, value, description)
VALUES
    (
        'inventory.thresholds',
        '{"default_min_threshold": 20, "expiry_warning_days": 60, "critical_expiry_days": 30}'::jsonb,
        'Configurable inventory reorder and FEFO expiry notification thresholds'
    ),
    (
        'claims.policy',
        '{"mode": "configurable_rate", "notes": "Awaiting DHQ Hospital Kohat formal rate agreement. Defaulting to catalogue unit price until agreed."}'::jsonb,
        'Hospital reimbursement claim calculation policy rules'
    ),
    (
        'hospital.identity',
        '{"name": "DHQ Hospital Kohat", "department": "Central Dispensary", "location": "Kohat, Khyber Pakhtunkhwa, Pakistan"}'::jsonb,
        'Hospital facility identification metadata'
    )
ON CONFLICT (key) DO NOTHING;
