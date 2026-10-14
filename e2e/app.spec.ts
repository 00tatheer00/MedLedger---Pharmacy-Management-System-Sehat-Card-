import { test, expect } from '@playwright/test';

test.describe('MedLedger Dashboard & Design System', () => {
  test('application loads and displays hospital branding and title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MedLedger/);
    await expect(page.getByRole('heading', { name: /Welcome back, Dr. Ayesha/i })).toBeVisible();
    await expect(page.getByText('DHQ Hospital Kohat').first()).toBeVisible();
  });

  test('displays all 4 core KPI summary metrics', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Total Medicines', { exact: true })).toBeVisible();
    await expect(page.getByText('Low Stock Items', { exact: true })).toBeVisible();
    await expect(page.getByText('Expiring Medicines', { exact: true })).toBeVisible();
    await expect(page.getByText('Pending Claims', { exact: true })).toBeVisible();
  });

  test('displays recent activity table and handles tab filtering', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Recent Inventory & Dispensing Activity')).toBeVisible();
    await expect(page.getByText('GRN-2026-0451')).toBeVisible();

    // Switch tab to Dispensing
    const dispensingTab = page.getByRole('tab', { name: /Dispensing/i });
    await dispensingTab.click();
    await expect(page.getByText('DSP-2026-1287')).toBeVisible();
  });

  test('navigates to reports dashboard, selects report, and tests reconciliation tab', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('nav a[href="/reports"]').first().click();
    await expect(page).toHaveURL('/reports');
    await expect(
      page.getByRole('heading', { name: /Statutory Reporting & Financial Ledger Audit/i }),
    ).toBeVisible();
    await expect(page.getByText('Supplier Payables', { exact: true })).toBeVisible();
    await expect(page.getByText('Treasury Receivables')).toBeVisible();

    // Verify reports tab is active and shows report selector
    await expect(page.getByText('Current Stock Overview').first()).toBeVisible();

    // Switch to Reconciliation tab
    const reconTab = page.getByRole('button', { name: /Payment & Claim Reconciliation/i });
    await reconTab.click();
    await expect(page.getByText(/Reconciliation Audit Ledger/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Run Live Audit/i })).toBeVisible();
  });

  test('navigates to patients directory, searches, and inspects patient profile', async ({
    page,
  }) => {
    await page.goto('/patients');
    await expect(
      page.getByRole('heading', { level: 1, name: /Patient Master Directory/i }),
    ).toBeVisible();
    await expect(page.getByText('MRN-2026-00101')).toBeVisible();
    await expect(page.getByText('Tariq Mehmood')).toBeVisible();

    // Search for Fatima
    const searchInput = page.getByPlaceholder(/Search by MR number/i);
    await searchInput.fill('Fatima');
    await page.getByRole('button', { name: /Apply/i }).click();
    await expect(page).toHaveURL(/search=Fatima/);
    await expect(page.getByText('Fatima Bibi')).toBeVisible();

    // View patient profile
    await page.goto('/patients/pat-002-kohat');
    await expect(page).toHaveURL(/\/patients\/pat-002-kohat/);
    await expect(page.getByRole('heading', { name: 'Fatima Bibi', exact: true })).toBeVisible();
    await expect(page.getByText('Female Surgical Ward').first()).toBeVisible();
  });

  test('navigates to prescription queue and transcribes paper prescription', async ({ page }) => {
    await page.goto('/prescriptions');
    await expect(page.getByRole('heading', { name: /Prescription Intake Queue/i })).toBeVisible();
    await expect(page.getByText(/RX-2026-/).first()).toBeVisible();

    // Click transcribe button
    await page.getByRole('link', { name: /Transcribe Paper Prescription/i }).click();
    await expect(page).toHaveURL('/prescriptions/new');
    await expect(page.getByText(/Paper Prescription Transcription Interface/i)).toBeVisible();

    // Click Auto-generate to guarantee fresh prescription number
    await page.getByRole('button', { name: /Auto-generate/i }).click();

    // Fill prescription fields
    await page.locator('#prescriber_name').fill('Dr. Tariq Bangash');
    await page.locator('#rx_notes').fill('Transcribed from emergency ward paper slip');

    // Submit prescription
    await page.getByRole('button', { name: /Record Order/i }).click();
    await expect(page).toHaveURL(/\/prescriptions\/rx-/);

    // Verify detail page & 0 stock issued invariant
    await expect(page.getByText(/Inventory Integrity Invariant/i)).toBeVisible();
    await expect(page.getByText(/Zero inventory units have been deducted/i)).toBeVisible();
  });

  test('navigates to inpatient admissions directory', async ({ page }) => {
    await page.goto('/admissions');
    await expect(
      page.getByRole('heading', { name: /Hospital Inpatient Admissions/i }),
    ).toBeVisible();
    await expect(page.getByText('ADM-2026-0412')).toBeVisible();
    await expect(page.getByText('Male Medical Ward')).toBeVisible();
  });

  test('navigates to medicines catalogue, searches, and inspects details', async ({ page }) => {
    await page.goto('/medicines');
    await expect(page.getByRole('heading', { name: /Medicines Master Catalogue/i })).toBeVisible();
    await expect(page.getByText('Amoxicillin 500mg').first()).toBeVisible();

    // Search for Ceftriaxone
    const searchInput = page.getByPlaceholder(/Search by brand name, generic name/i);
    await searchInput.fill('Ceftriaxone');
    await page.getByRole('button', { name: /Apply/i }).click();
    await expect(page).toHaveURL(/search=Ceftriaxone/);
    await expect(page.getByText('Ceftriaxone 1g').first()).toBeVisible();

    // Inspect medicine detail
    await page
      .getByRole('link', { name: /Details/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/medicines\/med-002/);
    await expect(page.getByText('Ceftriaxone Sodium').first()).toBeVisible();
    await expect(page.getByText('Inventory Balance Breakdown')).toBeVisible();
    await expect(page.getByText('B-2026-047').first()).toBeVisible();
  });

  test('navigates to inventory overview and verifies surveillance tabs', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: /Inventory & Stock Control/i })).toBeVisible();
    await expect(page.getByText(/Total Stock on Hand/i)).toBeVisible();
    await expect(page.getByText(/Batches Registry/i)).toBeVisible();

    // Switch to Stock Movements tab
    await page.getByRole('link', { name: /Stock Movement Ledger/i }).click();
    await expect(page).toHaveURL(/tab=movements/);
    await expect(page.getByText(/Immutable Stock Ledger/i)).toBeVisible();

    // Switch to Surveillance Alerts tab
    await page.getByRole('link', { name: /Surveillance Alerts/i }).click();
    await expect(page).toHaveURL(/tab=alerts/);
    await expect(page.getByText(/Insulin Glargine/i).first()).toBeVisible();
  });

  test('navigates to suppliers directory, searches, and inspects distributor profile', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(
      page.getByRole('heading', { level: 1, name: /Supplier & Vendor Directory/i }),
    ).toBeVisible();
    await expect(page.getByText('Kohat Pharma Distributors')).toBeVisible();

    // Search for Khyber
    const searchInput = page.getByPlaceholder(/Search by supplier name/i);
    await searchInput.fill('Khyber');
    await page.getByRole('button', { name: /Apply/i }).click();
    await expect(page).toHaveURL(/search=Khyber/);
    await expect(page.getByText('Khyber Drug Agency')).toBeVisible();

    // View supplier profile
    await page.getByRole('link', { name: 'Khyber Drug Agency' }).click();
    await expect(page).toHaveURL(/\/suppliers\/sup-002/);
    await expect(
      page.getByRole('heading', { level: 1, name: /Khyber Drug Agency — Vendor Profile/i }),
    ).toBeVisible();
    await expect(page.getByText('orders@khyberdrug.com').first()).toBeVisible();
    await expect(page.getByText(/Purchase Orders Placed/i)).toBeVisible();
  });

  test('navigates to purchases hub, inspects purchase order, and verifies GRN and invoice ledgers', async ({
    page,
  }) => {
    await page.goto('/purchases');
    await expect(
      page.getByRole('heading', { level: 1, name: /Procurement & Goods Receiving/i }),
    ).toBeVisible();
    await expect(page.getByText('PO-2026-0045')).toBeVisible();

    // Switch to Goods Receipts (GRN) tab
    await page.getByRole('link', { name: /Goods Receipts \(GRN\)/i }).click();
    await expect(page).toHaveURL(/tab=receipts/);
    await expect(page.getByText('GRN-2026-0451')).toBeVisible();

    // Switch to Invoices & Payables tab
    await page.getByRole('link', { name: /Invoices & Payables/i }).click();
    await expect(page).toHaveURL(/tab=invoices/);
    await expect(page.getByText('INV-KP-8821')).toBeVisible();
    await expect(page.getByRole('button', { name: /Record Payment/i })).toBeVisible();

    // Inspect Purchase Order detail page
    await page.goto('/purchases/po-001');
    await expect(
      page.getByRole('heading', { level: 1, name: /PO #PO-2026-0045 — Order Details/i }),
    ).toBeVisible();
    await expect(page.getByText('Amoxicillin 500mg').first()).toBeVisible();
    await expect(page.getByText('Fulfillment Rate')).toBeVisible();
  });

  test('navigates to medicine dispensing counter, selects prescription, reviews FEFO batch, and views history', async ({
    page,
  }) => {
    await page.goto('/dispensing');
    await expect(
      page.getByRole('heading', { level: 1, name: /Medicine Dispensing Counter/i }),
    ).toBeVisible();
    await expect(page.getByText('Lookup Patient Prescription Queue')).toBeVisible();

    // Select prescription for Tariq Mehmood
    await page
      .getByRole('button', { name: /Dispense Prescription/i })
      .first()
      .click();
    await expect(page.getByText('Active Dispensing Counter')).toBeVisible();
    await expect(page.getByText('Review & Finalize Dispensing')).toBeVisible();

    // Switch to history tab
    await page.getByRole('button', { name: /Dispensing History & Audit Log/i }).click();
    await expect(page.getByText('DSP-20261011-1042')).toBeVisible();
    await expect(page.getByText('Tariq Mehmood').first()).toBeVisible();
  });

  test('navigates to hospital claims queue, prepares new claim from eligible dispensing, and views claim details', async ({
    page,
  }) => {
    await page.goto('/claims');
    await expect(
      page.getByRole('heading', { level: 1, name: /Reimbursement Claims Management/i }),
    ).toBeVisible();
    await expect(page.getByText('Total Claims').first()).toBeVisible();
    await expect(page.getByText('Outstanding Balance').first()).toBeVisible();
    await expect(page.getByText('CLM-20261011-0001')).toBeVisible();

    // Click Prepare New Claim button
    await page.getByRole('link', { name: /Prepare New Claim/i }).click();
    await expect(page).toHaveURL('/claims/new');
    await expect(page.getByText('1. Claim Period & Notes')).toBeVisible();
    await expect(page.getByText('2. Select Eligible Dispensing Records')).toBeVisible();
    await expect(page.getByText('Compiled Claim Summary')).toBeVisible();

    // Navigate to claim detail view
    await page.goto('/claims/clm-001-kohat');
    await expect(page.getByRole('heading', { name: /CLM-20261011-0001/i }).first()).toBeVisible();
    await expect(page.getByText('Claim Line Items').first()).toBeVisible();
    await expect(page.getByText('Ceftriaxone 1g').first()).toBeVisible();

    // Switch to Reimbursement Payments tab
    await page.getByRole('button', { name: /Reimbursement Payments/i }).click();
    await expect(page.getByText('NBP-KOH-TX-849102')).toBeVisible();
    await expect(page.getByText('Bank Transfer (DHQ Treasury)')).toBeVisible();
  });
});
