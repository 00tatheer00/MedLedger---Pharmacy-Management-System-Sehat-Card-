import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.resolve('..', 'docs', 'screenshots');
const OUTPUT_PDF = path.resolve('..', 'docs', 'MedLedger_User_Manual.pdf');
const OUTPUT_HTML = path.resolve('..', 'docs', 'MedLedger_User_Manual.html');

function getBase64Image(filename) {
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: Image ${filename} not found at ${filePath}`);
    return '';
  }
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

console.log('Encoding screenshots into base64...');
const images = {
  dashboard: getBase64Image('01-dashboard.png'),
  search: getBase64Image('02-dashboard-search.png'),
  notifications: getBase64Image('03-dashboard-notifications.png'),
  update: getBase64Image('04-update-notification.png'),
  patients: getBase64Image('05-patients.png'),
  admissions: getBase64Image('06-admissions.png'),
  prescriptions: getBase64Image('07-prescriptions.png'),
  dispensing: getBase64Image('08-dispensing.png'),
  medicines: getBase64Image('09-medicines.png'),
  inventory: getBase64Image('10-inventory.png'),
  suppliers: getBase64Image('11-suppliers.png'),
  purchases: getBase64Image('12-purchases.png'),
  claims: getBase64Image('13-claims.png'),
  reports: getBase64Image('14-reports.png'),
};

console.log('Generating rich HTML manual template...');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MedLedger — User Manual & System Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11px;
      -webkit-font-smoothing: antialiased;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-container {
      height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30px 25px;
      background: linear-gradient(145deg, #022c22 0%, #064e3b 50%, #0f172a 100%);
      color: #ffffff;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #6ee7b7;
      text-transform: uppercase;
      width: fit-content;
    }

    .cover-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.15;
      margin-top: 14px;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #ffffff 0%, #a7f3d0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 16px;
      color: #cbd5e1;
      margin-top: 10px;
      font-weight: 500;
      line-height: 1.4;
      max-width: 600px;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 25px 0;
    }

    .cover-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 14px;
      backdrop-filter: blur(10px);
    }

    .cover-card h4 {
      font-size: 13px;
      color: #6ee7b7;
      margin-bottom: 4px;
      font-weight: 700;
    }

    .cover-card p {
      font-size: 10.5px;
      color: #cbd5e1;
      line-height: 1.35;
    }

    .cover-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .meta-val {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 2px;
    }

    /* Section Styling */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 10px;
      background: linear-gradient(90deg, #0f766e 0%, #0d9488 100%);
      color: white;
      margin-bottom: 12px;
    }

    .section-header h2 {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }

    .section-tag {
      font-size: 10px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.2);
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .feature-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 14px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .screenshot-frame {
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
      background: #f8fafc;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      display: block;
    }

    .screenshot-frame img {
      width: 100%;
      height: auto;
      display: block;
    }

    .callout-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      font-weight: 800;
      font-size: 10px;
      margin-right: 6px;
      flex-shrink: 0;
    }

    /* Table Layout */
    table.guide-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10.5px;
    }

    table.guide-table th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 7px 10px;
      font-weight: 700;
      border-bottom: 2px solid #cbd5e1;
    }

    table.guide-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }

    table.guide-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    .badge-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-teal { background: #ccfbf1; color: #0f766e; }
    .badge-blue { background: #e0f2fe; color: #0369a1; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .badge-rose { background: #ffe4e6; color: #be123c; }

    .step-box {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin: 8px 0;
    }

    .step-box h4 {
      font-size: 11.5px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 4px;
    }

    .step-box ol {
      padding-left: 18px;
      color: #1e293b;
    }

    .step-box li {
      margin-bottom: 3px;
    }

    .tip-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin: 8px 0;
      color: #1e3a8a;
    }

    .tip-box strong {
      color: #1d4ed8;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 15px 0;
    }

    .toc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .toc-title {
      font-weight: 700;
      color: #0f172a;
    }

    .toc-page {
      font-weight: 800;
      color: #0d9488;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-container">
    <div>
      <div class="cover-badge">
        <span>🏥 Government of Khyber Pakhtunkhwa</span>
      </div>
      <h1 class="cover-title">MedLedger</h1>
      <p class="cover-subtitle">
        Hospital Pharmacy Management System & Sehat Card Sahulat Program<br>
        <strong>District Headquarter (DHQ) Hospital Kohat</strong>
      </p>
    </div>

    <div>
      <div class="cover-grid">
        <div class="cover-card">
          <h4>🚀 100% FEFO Adherence</h4>
          <p>Automated First-Expiry-First-Out dispensing algorithms ensure zero stock expiration losses in hospital wards.</p>
        </div>
        <div class="cover-card">
          <h4>💳 Sehat Card Integration</h4>
          <p>Real-time CNIC claims validation, transparent package coverage checks, and instant government reimbursement filing.</p>
        </div>
        <div class="cover-card">
          <h4>⚡ Offline Resilience & PWA</h4>
          <p>PWA offline caching for OPD counters during network interruptions, with seamless background auto-sync.</p>
        </div>
      </div>

      <div style="background: rgba(0,0,0,0.25); border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.15);">
        <h4 style="color: #5eead4; font-size: 12px; font-weight: 700; margin-bottom: 6px;">📘 About This User Manual</h4>
        <p style="font-size: 10.5px; color: #e2e8f0; line-height: 1.4;">
          This official visual operational guide provides pharmacy managers, staff pharmacists, claims verification officers, and clinical administrators with comprehensive instructions on utilizing all features of the MedLedger system. Each section features live system screenshots, annotated control points, and step-by-step procedures.
        </p>
      </div>
    </div>

    <div class="cover-meta">
      <div class="meta-item">
        <span class="meta-label">Facility</span>
        <span class="meta-val">DHQ Hospital Kohat</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">System Version</span>
        <span class="meta-val">v0.1.0 Enterprise</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Live Deployment</span>
        <span class="meta-val">medledger-tau.vercel.app</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Release Date</span>
        <span class="meta-val">October 2026</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== TABLE OF CONTENTS ==================== -->
  <div class="section-header">
    <h2>📑 Table of Contents</h2>
    <span class="section-tag">System Map</span>
  </div>

  <div class="toc-grid">
    <div class="toc-item">
      <span class="toc-title">1. Global Navigation & Live Header</span>
      <span class="toc-page">Page 3</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">2. Real-Time Update Notifications & PWA</span>
      <span class="toc-page">Page 4</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">3. Pharmacy Operations Dashboard</span>
      <span class="toc-page">Page 5</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">4. Patient Registry & CNIC Lookup</span>
      <span class="toc-page">Page 6</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">5. Inpatient Admissions & Ward Beds</span>
      <span class="toc-page">Page 7</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">6. Electronic Prescriptions Intake</span>
      <span class="toc-page">Page 8</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">7. Dispensary & FEFO Fulfillment</span>
      <span class="toc-page">Page 9</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">8. Medicines Catalogue & Pricing</span>
      <span class="toc-page">Page 10</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">9. Inventory Control & Batch Expiry</span>
      <span class="toc-page">Page 11</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">10. Supplier Management & Vendor Directory</span>
      <span class="toc-page">Page 12</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">11. Purchase Orders & Goods Receiving (GRN)</span>
      <span class="toc-page">Page 13</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">12. KP Sehat Card Claims & Billing</span>
      <span class="toc-page">Page 14</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">13. Financial Reports & Stock Reconciliation</span>
      <span class="toc-page">Page 15</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">14. Security, Roles & Daily Operational Routine</span>
      <span class="toc-page">Page 16</span>
    </div>
  </div>

  <div class="step-box" style="margin-top: 15px;">
    <h4>🔑 User Roles in MedLedger</h4>
    <p style="font-size: 10px; margin-bottom: 6px;">MedLedger implements Role-Based Access Control (RBAC) configured for DHQ Hospital Kohat hierarchy:</p>
    <ul style="font-size: 10px; padding-left: 15px;">
      <li><strong>Staff Pharmacist (Ayesha Khan)</strong>: Frontline OPD/IPD dispensing, prescription verification, patient lookup, and stock adjustments.</li>
      <li><strong>Pharmacy Manager</strong>: Purchase order approval, supplier relations, batch inventory receiving, and audit oversight.</li>
      <li><strong>Claims Verification Officer</strong>: KP Sehat Card eligibility verification, claim dispute handling, and reimbursement submission.</li>
      <li><strong>Chief Medical Officer (CMO)</strong>: Hospital-wide executive analytics, budget compliance, and stock reconciliation audits.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 1: GLOBAL HEADER & SEARCH ==================== -->
  <div class="section-header">
    <h2>1. Global Header & Fast Navigation (Ctrl + K)</h2>
    <span class="section-tag">Core Interface</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Universal Search & Operations Bar</h3>
    <p style="color: #64748b; font-size: 10px;">The top header stays pinned across all screens, granting instant access to hospital shift data, global medicine search, operational alerts, and role simulation.</p>

    <div class="screenshot-frame">
      <img src="${images.search}" alt="Universal Search Palette Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 25%;">Feature Element</th>
          <th style="width: 35%;">Visual Location</th>
          <th style="width: 40%;">How to Use</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Search Shortcut (Ctrl + K)</strong></td>
          <td>Center of Header / Shortcut key</td>
          <td>Press <code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">Ctrl + K</code> from anywhere in the app to open the instant search modal. Type medicine brand, generic name, or patient CNIC.</td>
        </tr>
        <tr>
          <td><strong>Quick Action Shortcuts</strong></td>
          <td>Inside Search Palette Dialog</td>
          <td>Click predefined shortcuts like <em>"Dispense Medicine"</em>, <em>"Add Patient"</em>, or <em>"Review Claims"</em> for single-click navigation.</td>
        </tr>
        <tr>
          <td><strong>Active Hospital Shift</strong></td>
          <td>Left Header subtitle</td>
          <td>Displays current dispensary station: <em>DHQ Hospital Kohat — Central Dispensary</em>.</td>
        </tr>
        <tr>
          <td><strong>Simulated Role Switcher</strong></td>
          <td>Top Right Avatar (AK)</td>
          <td>Click the user profile dropdown to preview system permissions as Staff Pharmacist, Pharmacy Manager, or Claims Officer.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 2: LIVE NOTIFICATIONS & UPDATES ==================== -->
  <div class="section-header">
    <h2>2. Real-Time Update Notifications & PWA</h2>
    <span class="section-tag">System Reliability</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Floating "New Version Available" Alert & Bell Notifications</h3>
    <p style="color: #64748b; font-size: 10px;">MedLedger actively monitors deployment versions and hospital operational alerts so pharmacists never dispense with stale rules.</p>

    <div class="screenshot-frame">
      <img src="${images.update}" alt="New Version Available Floating Modal Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 25%;">Feature Element</th>
          <th style="width: 35%;">Visual Characteristics</th>
          <th style="width: 40%;">Operational Function</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>New Version Available Toast</strong></td>
          <td>Bottom-Right floating modal (<span class="badge-pill badge-blue">Sky Blue</span>)</td>
          <td>Appears automatically within 60 seconds whenever an IT deployment or pricing update occurs on Vercel.</td>
        </tr>
        <tr>
          <td><strong>"Update Now" Button</strong></td>
          <td>High-contrast black button on right</td>
          <td>One-click activation: signals the waiting Service Worker to take over and reloads the page with zero data loss.</td>
        </tr>
        <tr>
          <td><strong>Dismiss Circle (x)</strong></td>
          <td>Top-Left white circular icon</td>
          <td>Allows postponing the refresh if the pharmacist is currently in the middle of typing an active prescription line.</td>
        </tr>
      </tbody>
    </table>

    <div class="screenshot-frame" style="margin-top: 12px;">
      <img src="${images.notifications}" alt="System Alerts Panel Screenshot">
    </div>

    <div class="step-box">
      <h4>🔔 How to Handle System Alerts:</h4>
      <ol>
        <li>Click the <strong>Bell Icon</strong> in the top header (with pulsating red dot when unread alerts exist).</li>
        <li>Review high-priority alerts: Near-expiry antibiotics, low insulin stock, and rejected Sehat Card claims.</li>
        <li>Click <strong>"Mark all read"</strong> once actions have been delegated to shift pharmacists.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 3: DASHBOARD ==================== -->
  <div class="section-header">
    <h2>3. Pharmacy Operations Dashboard</h2>
    <span class="section-tag">Shift Control Center</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Live Operations Overview</h3>
    <p style="color: #64748b; font-size: 10px;">The central mission control for DHQ Hospital Kohat, providing real-time stock surveillance and Sehat Card claim KPIs.</p>

    <div class="screenshot-frame">
      <img src="${images.dashboard}" alt="Pharmacy Operations Dashboard Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 25%;">Metric Card</th>
          <th style="width: 20%;">Current State</th>
          <th style="width: 55%;">Significance & Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Total Medicines</strong></td>
          <td><span class="badge-pill badge-teal">1,247 SKUs</span></td>
          <td>Total active catalog formulations approved for DHQ Hospital formulary.</td>
        </tr>
        <tr>
          <td><strong>Low Stock Items</strong></td>
          <td><span class="badge-pill badge-amber">23 Items</span></td>
          <td>Items below the minimum hospital safety buffer threshold (&le; 20 units). Requires raising a Purchase Order.</td>
        </tr>
        <tr>
          <td><strong>Expiring Medicines</strong></td>
          <td><span class="badge-pill badge-rose">18 Batches</span></td>
          <td>Batches expiring within the next 90 days. Prioritized by automated FEFO algorithm to minimize expiration loss.</td>
        </tr>
        <tr>
          <td><strong>Pending Claims</strong></td>
          <td><span class="badge-pill badge-blue">7 In Review</span></td>
          <td>Sehat Card Sahulat claims currently being vetted by the state insurance panel for hospital reimbursement.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 4: PATIENTS ==================== -->
  <div class="section-header">
    <h2>4. Patient Registry & Sehat Card Lookup</h2>
    <span class="section-tag">Clinical Records</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Patient Database & National ID Verification</h3>
    <p style="color: #64748b; font-size: 10px;">Centralized directory linking patients with CNIC, Sehat Card entitlement, and OPD/IPD admission histories.</p>

    <div class="screenshot-frame">
      <img src="${images.patients}" alt="Patients Directory Screenshot">
    </div>

    <div class="step-box">
      <h4>📋 Patient Intake & Sehat Card Verification Workflow:</h4>
      <ol>
        <li>Navigate to <strong>Patients</strong> via the left sidebar.</li>
        <li>Enter the patient's 13-digit National ID (CNIC) or Medical Record Number (MRN) into the search filter.</li>
        <li>Observe the <strong>Sehat Card Status badge</strong>:
          <ul>
            <li><span class="badge-pill badge-teal">Verified</span>: Patient has active government medical coverage. Free medicine eligible.</li>
            <li><span class="badge-pill badge-amber">Pending Verification</span>: Requires identity confirmation with NADRA / Sehat Card desk.</li>
          </ul>
        </li>
        <li>Click <strong>"+ New Patient"</strong> in the top right to register emergency or walk-in patients.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 5: ADMISSIONS ==================== -->
  <div class="section-header">
    <h2>5. Inpatient Admissions & Ward Management</h2>
    <span class="section-tag">IPD Operations</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Ward Bed Allocation & Daily Bedside Dispensing</h3>
    <p style="color: #64748b; font-size: 10px;">Track admitted patients in Surgical, Medical, Pediatric, and ICU wards at DHQ Hospital Kohat.</p>

    <div class="screenshot-frame">
      <img src="${images.admissions}" alt="Admissions Screen Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Column</th>
          <th>Description</th>
          <th>Operational Instructions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Admission ID & Ward</strong></td>
          <td>Ward designation (e.g. Ward 3B, Bed 12)</td>
          <td>Determines where dispensary delivery runners deliver scheduled intravenous and oral medications.</td>
        </tr>
        <tr>
          <td><strong>Admitting Doctor</strong></td>
          <td>Attending Physician / Specialist</td>
          <td>Only authorized prescriptions signed by the registered attending consultant can be charged to Sehat Card.</td>
        </tr>
        <tr>
          <td><strong>Status</strong></td>
          <td><span class="badge-pill badge-teal">Admitted</span> / <span class="badge-pill badge-blue">Discharged</span></td>
          <td>Upon patient discharge, all pending ward medicine balances are reconciled before final bill clearance.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 6: PRESCRIPTIONS ==================== -->
  <div class="section-header">
    <h2>6. Electronic Prescriptions Intake</h2>
    <span class="section-tag">Physician Orders</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Digital Doctor Orders & Medication Schedules</h3>
    <p style="color: #64748b; font-size: 10px;">Eliminates handwritten medication errors with structured dosage, frequency, and duration tracking.</p>

    <div class="screenshot-frame">
      <img src="${images.prescriptions}" alt="Prescriptions List Screenshot">
    </div>

    <div class="step-box">
      <h4>💊 Prescriptions Verification Workflow:</h4>
      <ol>
        <li>Click on any prescription row to inspect individual drug lines, dosage (e.g. <em>500mg BID</em>), and route.</li>
        <li>Review ICD-10 diagnosis tagging to ensure treatment matches government hospital guidelines.</li>
        <li>Check the <strong>Fulfillment Status</strong>:
          <ul>
            <li><span class="badge-pill badge-amber">Pending</span>: Ready for dispensary pharmacist verification.</li>
            <li><span class="badge-pill badge-teal">Dispensed</span>: Medications handed over to patient/attendant.</li>
          </ul>
        </li>
        <li>Click <strong>"Dispense Medicine"</strong> to transfer the prescription directly into the FEFO dispensing engine.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 7: DISPENSING & FEFO ==================== -->
  <div class="section-header">
    <h2>7. Dispensary & FEFO Fulfillment (First-Expiry-First-Out)</h2>
    <span class="section-tag">Primary Workflow</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Automated Expiry-Sorted Dispensing Engine</h3>
    <p style="color: #64748b; font-size: 10px;">Guarantees optimal drug stock rotation by automatically selecting earliest-expiring active batches.</p>

    <div class="screenshot-frame">
      <img src="${images.dispensing}" alt="Dispensary and Dispensing History Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Step</th>
          <th>Action</th>
          <th>System Protection Rule</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Select Prescription</strong></td>
          <td>Load patient prescription by token or MRN</td>
          <td>System locks medicine inventory to prevent double-dispensing across different dispensary counters.</td>
        </tr>
        <tr>
          <td><strong>2. Automated Batch Selection</strong></td>
          <td>System selects batch with earliest expiration date</td>
          <td><strong>FEFO Enforced:</strong> Pharmacists cannot bypass earlier batches without manager override reason.</td>
        </tr>
        <tr>
          <td><strong>3. Claim / Cash Allocation</strong></td>
          <td>Calculate Sehat Card coverage vs patient copay</td>
          <td>Exact integer paisa precision arithmetic ensures ledger accuracy with zero rounding drift.</td>
        </tr>
        <tr>
          <td><strong>4. Print Bilingual Receipt</strong></td>
          <td>Generate thermal receipt in Urdu & English</td>
          <td>Includes dosage instructions in Urdu for clear patient comprehension.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 8: MEDICINES CATALOGUE ==================== -->
  <div class="section-header">
    <h2>8. Medicines Catalogue & Pricing Control</h2>
    <span class="section-tag">Drug Master</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Hospital Formulary & Dosage Forms</h3>
    <p style="color: #64748b; font-size: 10px;">Master pharmaceutical catalogue compliant with DRAP (Drug Regulatory Authority of Pakistan) standards.</p>

    <div class="screenshot-frame">
      <img src="${images.medicines}" alt="Medicines Catalogue Screenshot">
    </div>

    <div class="tip-box">
      <strong>💡 Catalogue Management Standard:</strong> Every medicine entry contains both its commercial brand name (e.g., <em>Augmentin</em>) and International Nonproprietary Name generic title (<em>Amoxicillin + Clavulanic Acid</em>), strength (<em>625mg</em>), dosage form (<em>Tablet</em>), and maximum retail price (MRP).
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 9: INVENTORY CONTROL ==================== -->
  <div class="section-header">
    <h2>9. Inventory Control & Batch Expiry Surveillance</h2>
    <span class="section-tag">Stock Management</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Batch-Level Tracking & Safety Stock Triggers</h3>
    <p style="color: #64748b; font-size: 10px;">Real-time inventory levels broken down by batch code, supplier provenance, and exact storage location.</p>

    <div class="screenshot-frame">
      <img src="${images.inventory}" alt="Inventory Stock Levels Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Indicator</th>
          <th>Color Status</th>
          <th>Immediate Mandatory Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Adequate Stock</strong></td>
          <td><span class="badge-pill badge-teal">In Stock</span></td>
          <td>Inventory level exceeds 30-day average consumption. Normal dispensing.</td>
        </tr>
        <tr>
          <td><strong>Low Stock Warning</strong></td>
          <td><span class="badge-pill badge-amber">Reorder Level</span></td>
          <td>Quantity is at or below reorder threshold. Triggers automated procurement requisition.</td>
        </tr>
        <tr>
          <td><strong>Critical Expiry Alert</strong></td>
          <td><span class="badge-pill badge-rose">Expiring &lt; 90 Days</span></td>
          <td>Move stock to high-volume outpatient OPD counter to guarantee usage before expiry.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 10: SUPPLIERS ==================== -->
  <div class="section-header">
    <h2>10. Supplier Management & Vendor Directory</h2>
    <span class="section-tag">Procurement</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Approved Pharmaceutical Distributors</h3>
    <p style="color: #64748b; font-size: 10px;">Pre-qualified drug distributors supplying DHQ Hospital Kohat with active drug sales licenses.</p>

    <div class="screenshot-frame">
      <img src="${images.suppliers}" alt="Suppliers Directory Screenshot">
    </div>

    <div class="step-box">
      <h4>🏢 Vendor Compliance Requirements:</h4>
      <ul>
        <li><strong>Drug Sale License (DSL)</strong>: Must be validated and stored on file with expiry dates.</li>
        <li><strong>NTN & Sales Tax Registration</strong>: Verified with FBR for government withholding tax deduction.</li>
        <li><strong>Cold Chain Certificate</strong>: Mandatory for insulin, vaccines, and biologics distributors.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 11: PURCHASING & GRN ==================== -->
  <div class="section-header">
    <h2>11. Purchase Orders & Goods Receiving Notes (GRN)</h2>
    <span class="section-tag">Supply Chain</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Inward Batch Logging & Quality Verification</h3>
    <p style="color: #64748b; font-size: 10px;">Three-way matching between Purchase Order (PO), Supplier Invoice, and physical Goods Receiving Note (GRN).</p>

    <div class="screenshot-frame">
      <img src="${images.purchases}" alt="Purchase Orders and Inward Receiving Screenshot">
    </div>

    <div class="step-box">
      <h4>📦 Step-by-Step Receiving Protocol:</h4>
      <ol>
        <li>Inspect physical medicine cartons for tamper seals, batch numbers, and manufacturer expiry stamps.</li>
        <li>Open MedLedger &rarr; <strong>Purchases</strong> &rarr; Locate the matching Purchase Order.</li>
        <li>Click <strong>"Log Goods Receipt (GRN)"</strong>. Enter actual received pack quantities and batch lot numbers.</li>
        <li>Verify unit purchase price against invoice. MedLedger automatically increases stock upon submission.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 12: SEHAT CARD CLAIMS ==================== -->
  <div class="section-header">
    <h2>12. KP Sehat Card Sahulat Claims & Billing</h2>
    <span class="section-tag">Government Program</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Universal Health Coverage Reimbursements</h3>
    <p style="color: #64748b; font-size: 10px;">Automated claims generation from verified dispensing transactions for government insurance reimbursement.</p>

    <div class="screenshot-frame">
      <img src="${images.claims}" alt="Sehat Card Claims and Billing Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Claim Status</th>
          <th>Color Badge</th>
          <th>Meaning & Next Step</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Draft / Pending</strong></td>
          <td><span class="badge-pill badge-amber">Under Review</span></td>
          <td>Claim generated by pharmacy dispensary. Awaiting internal claims officer audit check.</td>
        </tr>
        <tr>
          <td><strong>Submitted</strong></td>
          <td><span class="badge-pill badge-blue">Submitted</span></td>
          <td>Dispatched electronically to KP Sehat Card TPA portal for formal review.</td>
        </tr>
        <tr>
          <td><strong>Approved & Settled</strong></td>
          <td><span class="badge-pill badge-teal">Settled / Paid</span></td>
          <td>Funds transferred directly into DHQ Hospital Kohat designated bank account.</td>
        </tr>
        <tr>
          <td><strong>Rejected / Disputed</strong></td>
          <td><span class="badge-pill badge-rose">Rejected</span></td>
          <td>Requires attaching additional clinical notes or corrected admission ICD-10 code.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 13: FINANCIAL REPORTS ==================== -->
  <div class="section-header">
    <h2>13. Financial Reports & Stock Reconciliation</h2>
    <span class="section-tag">Governance & Audit</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Executive Analytics & Exportable Audit Trails</h3>
    <p style="color: #64748b; font-size: 10px;">Comprehensive reports for hospital financial audits, inventory valuation, and consumption forecasting.</p>

    <div class="screenshot-frame">
      <img src="${images.reports}" alt="Financial and Audit Reports Screenshot">
    </div>

    <div class="step-box">
      <h4>📊 Key Reporting Capabilities:</h4>
      <ul>
        <li><strong>Daily Dispensary Cash vs Sehat Card Summary</strong>: Reconciles cash drawer against insurance tallies.</li>
        <li><strong>Stock Valuation by Batch</strong>: Calculates total hospital capital locked in medicines at landed cost.</li>
        <li><strong>Expiry Loss Prevention Audit</strong>: Identifies batches requiring transfer before expiration date.</li>
        <li><strong>CSV / Excel Export</strong>: Single-click export for provincial health ministry reports.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 14: SECURITY & ROUTINE ==================== -->
  <div class="section-header">
    <h2>14. Security, Roles & Daily Operational Routine</h2>
    <span class="section-tag">Hospital SOP</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Standard Operating Procedure (SOP) for Daily Shifts</h3>
    <p style="color: #64748b; font-size: 10px;">Mandatory daily routine for morning, evening, and night dispensary shifts at DHQ Hospital Kohat.</p>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 20%;">Shift Phase</th>
          <th style="width: 40%;">Primary Tasks</th>
          <th style="width: 40%;">System Verification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Morning Handover (08:00)</strong></td>
          <td>Log in with personal staff credentials. Inspect Priority Alerts on Dashboard. Review Low Stock warnings.</td>
          <td>Verify physical emergency drawer stock matches MedLedger reported count.</td>
        </tr>
        <tr>
          <td><strong>Mid-Shift Dispensing</strong></td>
          <td>Fulfill OPD and IPD ward prescriptions strictly using FEFO suggestions. Check Sehat Card validity.</td>
          <td>Always verify patient CNIC matches card holder before dispensing government-subsidized items.</td>
        </tr>
        <tr>
          <td><strong>Evening Reconciliation (16:00)</strong></td>
          <td>Print shift cash summary from Reports. Handover unfulfilled ward orders to incoming night pharmacist.</td>
          <td>Review pending claims to ensure zero backlogged Sehat Card tickets.</td>
        </tr>
      </tbody>
    </table>

    <div class="step-box" style="margin-top: 15px;">
      <h4>🛡️ Data Security & Integrity Policies:</h4>
      <ul>
        <li><strong>Strict Audit Logging</strong>: Every dispensing event, stock manual adjustment, and prescription modification records the pharmacist ID and timestamp.</li>
        <li><strong>Integer Paisa Arithmetic</strong>: Financial calculations operate in paisa units (PKR * 100) to eliminate floating-point rounding discrepancies during accounting audits.</li>
        <li><strong>Row-Level Security (RLS)</strong>: Clinical records are encrypted and protected by Supabase RLS database policies.</li>
      </ul>
    </div>

    <div style="margin-top: 30px; text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h3 style="font-size: 14px; font-weight: 800; color: #0f766e; margin-bottom: 4px;">District Headquarter (DHQ) Hospital Kohat</h3>
      <p style="font-size: 10px; color: #64748b;">MedLedger Pharmacy Management & KP Sehat Card Sahulat System</p>
      <p style="font-size: 9px; color: #94a3b8; margin-top: 6px;">Technical Support: Tech4Edges | IT Directorate Health KP</p>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf-8');
console.log(`Saved HTML manual to: ${OUTPUT_HTML}`);

async function generatePDF() {
  console.log('Launching Chrome to compile HTML into publication PDF...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(`file:///${OUTPUT_HTML.replace(/\\\\/g, '/')}`, {
    waitUntil: 'networkidle',
  });

  console.log('Printing to PDF with high-DPI print background...');
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '10mm',
      right: '10mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 8px; font-family: 'Plus Jakarta Sans', sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 12mm;">
        <span>MedLedger — DHQ Hospital Kohat | Official User Manual</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  console.log(`SUCCESS: PDF successfully generated at: ${OUTPUT_PDF}`);
}

generatePDF().catch(console.error);
