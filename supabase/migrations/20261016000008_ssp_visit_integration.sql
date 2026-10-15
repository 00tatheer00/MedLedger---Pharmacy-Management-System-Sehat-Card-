-- ==============================================================================
-- MedLedger — Sehat Sahulat Program (SSP) Visit Number & Requisition Integration
-- Migration: 20261016000008_ssp_visit_integration.sql
-- Architecture: Modular Monolith (PostgreSQL / Supabase)
-- Target: DHQ Hospital Kohat central pharmacy & Sehat Card Inpatient billing
-- Version: 0.11.0
-- ==============================================================================

-- 1. Add SSP Visit Number (Party Code) to Admissions Table
ALTER TABLE admissions 
ADD COLUMN IF NOT EXISTS ssp_visit_no VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_admissions_ssp_visit 
ON admissions(ssp_visit_no) 
WHERE deleted_at IS NULL;

-- 2. Add SSP Visit Number to Prescriptions Table (for direct prescription indexing)
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS ssp_visit_no VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_prescriptions_ssp_visit 
ON prescriptions(ssp_visit_no) 
WHERE deleted_at IS NULL;

-- 3. Document Columns in Database Schema
COMMENT ON COLUMN admissions.ssp_visit_no IS 
'Unique Sehat Sahulat Program (SSP / Sehat Card) Visit Number (e.g. 37634827), printed on doctor medicine requisition pads and pharmacy invoices.';

COMMENT ON COLUMN prescriptions.ssp_visit_no IS 
'Optional denormalized or direct SSP Visit Number linking the prescription slip to the Sehat Sahulat Program.';
