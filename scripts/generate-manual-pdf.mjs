import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.resolve('..', 'docs', 'screenshots');
const OUTPUT_PDF = path.resolve('..', 'docs', 'MedLedger_User_Manual.pdf');
const OUTPUT_HTML = path.resolve('..', 'docs', 'MedLedger_User_Manual.html');
const PUBLIC_DOCS_DIR = path.resolve('public', 'docs');

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

console.log('Generating Roman Urdu HTML manual template...');

const htmlContent = `<!DOCTYPE html>
<html lang="ur-Latn">
<head>
  <meta charset="UTF-8">
  <title>MedLedger — Mukammal System Guide & User Manual (Roman Urdu)</title>
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
      line-height: 1.48;
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
      max-width: 620px;
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
      font-size: 15.5px;
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

    .step-box ol, .step-box ul {
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

  <!-- ==================== COVER PAGE (ROMAN URDU) ==================== -->
  <div class="cover-container">
    <div>
      <div class="cover-badge">
        <span>🏥 Hukumat-e-Khyber Pakhtunkhwa — DHQ Hospital Kohat</span>
      </div>
      <h1 class="cover-title">MedLedger</h1>
      <p class="cover-subtitle">
        Hospital Pharmacy Management System & KP Sehat Card Sahulat Program<br>
        <strong>Mukammal User Manual & Feature Guide (Roman Urdu Mein)</strong>
      </p>
    </div>

    <div>
      <div class="cover-grid">
        <div class="cover-card">
          <h4>🚀 100% FEFO Tareeqa</h4>
          <p>Jo dawai pehle expire hone wali ho, system usay pehle dispense karwata hai taake hospital ka koi stock zaya na ho.</p>
        </div>
        <div class="cover-card">
          <h4>💳 Sehat Card Sahulat</h4>
          <p>Mareez ke CNIC se foran eligibility check karein, muft dawai ka record rakhein, aur government claim file karein.</p>
        </div>
        <div class="cover-card">
          <h4>⚡ Offline Kaam & Auto-Sync</h4>
          <p>Agar internet chala bhi jaye to OPD counter chalta rahe ga. Net wapis aane par tamam data khud-bakhud sync hojata hai.</p>
        </div>
      </div>

      <div style="background: rgba(0,0,0,0.25); border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.15);">
        <h4 style="color: #5eead4; font-size: 12px; font-weight: 700; margin-bottom: 6px;">📘 Is Manual Ke Baray Mein:</h4>
        <p style="font-size: 10.5px; color: #e2e8f0; line-height: 1.45;">
          Ye official guide DHQ Hospital Kohat ke pharmacy managers, staff pharmacists, claims verification officers, aur hospital administration ke liye banayi gayi hai. Is document mein website ke har page ka live screenshot shamil hai taake asani se samajh aye ke <strong>konsa feature kahan hai aur usay kaisay use karna hai</strong>.
        </p>
      </div>
    </div>

    <div class="cover-meta">
      <div class="meta-item">
        <span class="meta-label">Hospital / Markaz</span>
        <span class="meta-val">DHQ Hospital Kohat</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">System Version</span>
        <span class="meta-val">v0.1.0 Enterprise</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Live Website</span>
        <span class="meta-val">medledger-tau.vercel.app</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Zaban (Language)</span>
        <span class="meta-val">Roman Urdu</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== TABLE OF CONTENTS (FEHRIST) ==================== -->
  <div class="section-header">
    <h2>📑 Fehrist (Table of Contents)</h2>
    <span class="section-tag">System Ki Tafseelat</span>
  </div>

  <div class="toc-grid">
    <div class="toc-item">
      <span class="toc-title">1. Main Header & Fast Search (Ctrl + K)</span>
      <span class="toc-page">Safa 3</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">2. Naye Updates Ka Notification & PWA Offline</span>
      <span class="toc-page">Safa 4</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">3. Pharmacy Operations Dashboard</span>
      <span class="toc-page">Safa 5</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">4. Mareezon Ka Record (Patients) & CNIC</span>
      <span class="toc-page">Safa 6</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">5. Dakhil Mareez (Admissions) & Ward Beds</span>
      <span class="toc-page">Safa 7</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">6. Doctor Ke Nuskhe (Prescriptions Intake)</span>
      <span class="toc-page">Safa 8</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">7. Dawai Dena (Dispensary & FEFO Fulfillment)</span>
      <span class="toc-page">Safa 9</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">8. Dawaiyon Ki Master List (Medicines Catalogue)</span>
      <span class="toc-page">Safa 10</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">9. Stock & Expiry Control (Inventory Management)</span>
      <span class="toc-page">Safa 11</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">10. Suppliers & Dawai Ki Companies</span>
      <span class="toc-page">Safa 12</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">11. Nayi Dawai Khareedna (Purchases & GRN)</span>
      <span class="toc-page">Safa 13</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">12. Sehat Card Claims & Government Billing</span>
      <span class="toc-page">Safa 14</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">13. Maliyati Reports & Stock Hisaab Kitaab</span>
      <span class="toc-page">Safa 15</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">14. Security SOPs & Rozana Shift Ka Tareeqa</span>
      <span class="toc-page">Safa 16</span>
    </div>
  </div>

  <div class="step-box" style="margin-top: 15px;">
    <h4>👥 MedLedger Mein Staff Ke Roles Aur Unka Kaam:</h4>
    <p style="font-size: 10px; margin-bottom: 6px;">Hospital ke mukhtalif staff ke mutabiq system mein mukhtalif permissions hain:</p>
    <ul style="font-size: 10.5px; padding-left: 15px; line-height: 1.5;">
      <li><strong>Staff Pharmacist (Dr. Ayesha Khan)</strong>: Counter par mareezon ko dawai dena, doctor ka nuskha verify karna, patient lookup aur stock check karna.</li>
      <li><strong>Pharmacy Manager</strong>: Suppliers se maal khareedna (PO approve karna), warehouse mein stock dakhil karna, aur rozana ka audit karna.</li>
      <li><strong>Claims Verification Officer</strong>: Mareez ka Sehat Card check karna, insurance claims bhej kar hukumat se payment clear karwana.</li>
      <li><strong>Chief Medical Officer (CMO)</strong>: Poore hospital ka stock audit, budget aur reports ka jaiza lena.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 1: GLOBAL HEADER & SEARCH ==================== -->
  <div class="section-header">
    <h2>1. Main Header & Fast Search (Ctrl + K)</h2>
    <span class="section-tag">Bunyadi Interface</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Search Aur Operation Bar Kahan Hai Aur Kaise Use Karein</h3>
    <p style="color: #64748b; font-size: 10px;">Header screen ke bilkul oopar rehta hai aur kisi bhi page par jayein wahan se gayab nahi hota.</p>

    <div class="screenshot-frame">
      <img src="${images.search}" alt="Universal Search Palette Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 25%;">Feature Ka Naam</th>
          <th style="width: 30%;">Screen Par Kahan Hai?</th>
          <th style="width: 45%;">Istemal Karne Ka Tareeqa (How to Use)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Fast Search (Ctrl + K)</strong></td>
          <td>Header ke darmiyan mein search box</td>
          <td>Keyboard se <code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">Ctrl + K</code> dabayein ya mouse se click karein. Kisi bhi dawai ka naam, formula ya mareez ka CNIC likhein foran result samne ajaye ga.</td>
        </tr>
        <tr>
          <td><strong>Quick Action Shortcuts</strong></td>
          <td>Search dialog khulne ke baad</td>
          <td>Yahan direct buttons hain jaisay <em>"Dispense Medicine"</em>, <em>"Add Patient"</em>, ya <em>"Review Claims"</em>. Aik click se mutalqa screen khul jaye gi.</td>
        </tr>
        <tr>
          <td><strong>Active Hospital Shift</strong></td>
          <td>Header ke baayein (left) taraf</td>
          <td>Yahan show hota hai ke is waqt konsa dispensary counter aur shift active hai: <em>DHQ Hospital Kohat — Central Dispensary</em>.</td>
        </tr>
        <tr>
          <td><strong>Role Switcher Menu</strong></td>
          <td>Header ke daayein (right) taraf avatar (AK)</td>
          <td>Dr. Ayesha Khan ke profile par click karke aap check kar saktay hain ke mukhtalif roles (Manager, Pharmacist, Claims Officer) ko system kaisa nazar ata hai.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 2: LIVE NOTIFICATIONS & UPDATES ==================== -->
  <div class="section-header">
    <h2>2. Naye Updates Ka Notification & PWA Offline Kaam</h2>
    <span class="section-tag">Hamesha Latest Version</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Naya Version Alert ("New Version Available") Aur Bell Notifications</h3>
    <p style="color: #64748b; font-size: 10px;">Jab bhi website par koi naya update ya qeemat tabdeel hogi, system screen par foran alert dikhaye ga.</p>

    <div class="screenshot-frame">
      <img src="${images.update}" alt="New Version Available Floating Modal Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 28%;">Alert Ka Feature</th>
          <th style="width: 27%;">Kaisa Nazar Aata Hai?</th>
          <th style="width: 45%;">Iska Kya Matlab Hai Aur Kya Karein?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>"New Version Available" Alert</strong></td>
          <td>Screen ke neeche daayein (bottom-right) taraf sky-blue card</td>
          <td>Jab bhi naya code Vercel par push hota hai, background checker har 60 second mein check karta hai aur ye toast dikha deta hai.</td>
        </tr>
        <tr>
          <td><strong>"Update Now" Button</strong></td>
          <td>Card ke andar black (kala) button</td>
          <td>Is button ko click karein! System foran latest service worker activate karke page reload kar dega taake aapko naye features mil sakein.</td>
        </tr>
        <tr>
          <td><strong>Close Button (x)</strong></td>
          <td>Card ke oopar baayein taraf safaid gola</td>
          <td>Agar aap us waqt koi zaroori nuskha likh rahay hain to cross dabakar isay band kar saktay hain aur free hone ke baad refresh kar saktay hain.</td>
        </tr>
      </tbody>
    </table>

    <div class="screenshot-frame" style="margin-top: 12px;">
      <img src="${images.notifications}" alt="System Alerts Panel Screenshot">
    </div>

    <div class="step-box">
      <h4>🔔 Hospital Alerts Dekhne Ka Tareeqa:</h4>
      <ol>
        <li>Header mein <strong>Bell Icon (Ghanti)</strong> par click karein. Agar koi naya alert hoga to red dot chal raha hoga.</li>
        <li>Alerts check karein: Maslan <em>"Augmentin stock low hai"</em> ya <em>"Batch EXP-2026 expire hone wala hai"</em>.</li>
        <li>Kaam mukammal hone par <strong>"Mark all read"</strong> dabayein taake list saaf hojaye.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 3: DASHBOARD ==================== -->
  <div class="section-header">
    <h2>3. Pharmacy Operations Dashboard</h2>
    <span class="section-tag">Markazi Control Room</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Hospital Dispensary Ka Live Jaiza (Overview)</h3>
    <p style="color: #64748b; font-size: 10px;">Subha duty shuru hotay hi sab se pehle dashboard check karein taake poore hospital ka haal samne ajaye.</p>

    <div class="screenshot-frame">
      <img src="${images.dashboard}" alt="Pharmacy Operations Dashboard Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 25%;">Dashboard Ka Card</th>
          <th style="width: 20%;">Moojooda Tadad</th>
          <th style="width: 55%;">Iska Kya Matlab Hai Aur Kya Action Lena Hai?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Total Medicines</strong></td>
          <td><span class="badge-pill badge-teal">1,247 Dawaiyan</span></td>
          <td>DHQ Hospital Kohat ki approved formulary mein kul kitni mukhtalif dawaiyan dakhil hain.</td>
        </tr>
        <tr>
          <td><strong>Low Stock Items</strong></td>
          <td><span class="badge-pill badge-amber">23 Items Kam Hain</span></td>
          <td>Aisi dawaiyan jin ka stock khatam hone ke qareeb hai (&le; 20 units). Foran Purchase Order raise karein.</td>
        </tr>
        <tr>
          <td><strong>Expiring Medicines</strong></td>
          <td><span class="badge-pill badge-rose">18 Batches Jaldi</span></td>
          <td>Jo dawaiyan aglay 90 dino mein expire hone wali hain. System khud inhein pehle dispense karne ko kahe ga.</td>
        </tr>
        <tr>
          <td><strong>Pending Claims</strong></td>
          <td><span class="badge-pill badge-blue">7 Review Mein</span></td>
          <td>Sehat Card ke claims jo review ke liye gaye huway hain aur jin ke paise hospital ko aane hain.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 4: PATIENTS ==================== -->
  <div class="section-header">
    <h2>4. Mareezon Ka Record (Patients) & CNIC Lookup</h2>
    <span class="section-tag">Clinical Record</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Mareez Ko Search Karna Aur Sehat Card Check Karna</h3>
    <p style="color: #64748b; font-size: 10px;">Yahan har mareez ka shanakhti card (CNIC), phone number aur Sehat Card entitlement moojood hai.</p>

    <div class="screenshot-frame">
      <img src="${images.patients}" alt="Patients Directory Screenshot">
    </div>

    <div class="step-box">
      <h4>📋 Naye Mareez Ko Check Aur Register Karne Ka Tareeqa:</h4>
      <ol>
        <li>Left sidebar se <strong>Patients</strong> par click karein.</li>
        <li>Search bar mein mareez ka 13-digit <strong>CNIC number</strong> (bina dash ke) ya MRN number likhein.</li>
        <li>Status badge check karein:
          <ul>
            <li><span class="badge-pill badge-teal">Verified</span>: Mareez ka Sehat Card active hai, muft dawai mil sakti hai.</li>
            <li><span class="badge-pill badge-amber">Pending Verification</span>: Shanakht ki tasdeeq NADRA ya Sehat Card desk se karwayein.</li>
          </ul>
        </li>
        <li>Agar mareez pehli baar aya hai to oopar daayein taraf <strong>"+ New Patient"</strong> button daba kar dakhil karein.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 5: ADMISSIONS ==================== -->
  <div class="section-header">
    <h2>5. Dakhil Mareez (Admissions) & Ward Beds</h2>
    <span class="section-tag">IPD Management</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Hospital Wards Aur Bed Allocation Ka Record</h3>
    <p style="color: #64748b; font-size: 10px;">Surgical, Medical, Pediatric, aur ICU wards mein dakhil mareezon ki dawaiyon ki supply yahan se track hoti hai.</p>

    <div class="screenshot-frame">
      <img src="${images.admissions}" alt="Admissions Screen Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Column</th>
          <th>Tafseel</th>
          <th>Dispensary Staff Ke Liye Hidayat</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Admission ID & Ward</strong></td>
          <td>Ward aur Bed number (e.g. Ward 3B, Bed 12)</td>
          <td>Dispensary runner ko pata chalta hai ke drip ya injections kis ward aur kis bed par pohnchane hain.</td>
        </tr>
        <tr>
          <td><strong>Admitting Doctor</strong></td>
          <td>Moalij Doctor / Specialist</td>
          <td>Sehat Card par sirf wohi dawai di ja sakti hai jo dakhil karne walay authorized consultant ne likhi ho.</td>
        </tr>
        <tr>
          <td><strong>Status Badge</strong></td>
          <td><span class="badge-pill badge-teal">Admitted</span> ya <span class="badge-pill badge-blue">Discharged</span></td>
          <td>Jab mareez discharge hota hai to dispensary se clearance certificate verify hota hai.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 6: PRESCRIPTIONS ==================== -->
  <div class="section-header">
    <h2>6. Doctor Ke Nuskhe (Prescriptions Intake)</h2>
    <span class="section-tag">Digital Nuskha</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Doctor Ke Orders Aur Dosage Schedule Check Karna</h3>
    <p style="color: #64748b; font-size: 10px;">Kharab handwriting ki galatiyon se bachne ke liye digital prescriptions ka nizam.</p>

    <div class="screenshot-frame">
      <img src="${images.prescriptions}" alt="Prescriptions List Screenshot">
    </div>

    <div class="step-box">
      <h4>💊 Prescription Ko Check Aur Dispense Karne Ka Tareeqa:</h4>
      <ol>
        <li>Nuskhe ki row par click karein aur dekhein ke konsi dawai kis miqdaar (e.g. <em>500mg BID - Subha Shaam</em>) mein likhi hai.</li>
        <li>ICD-10 bimari ka code check karein taake tasdeeq ho ke ilaaj government guidelines ke ain mutabiq hai.</li>
        <li>Status check karein:
          <ul>
            <li><span class="badge-pill badge-amber">Pending</span>: Dawai abhi counter se nikaalna baqi hai.</li>
            <li><span class="badge-pill badge-teal">Dispensed</span>: Mareez ko dawai di ja chuki hai.</li>
          </ul>
        </li>
        <li><strong>"Dispense Medicine"</strong> ka button dabayein taake system FEFO ke mutabiq batch utha laye.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 7: DISPENSING & FEFO ==================== -->
  <div class="section-header">
    <h2>7. Dawai Dena (Dispensary & FEFO Fulfillment)</h2>
    <span class="section-tag">Markazi Kaam</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">First-Expiry-First-Out (FEFO) Auto Allocation</h3>
    <p style="color: #64748b; font-size: 10px;">System khud wo batch chunta hai jis ki expiry qareeb ho taake purana stock zaya na ho.</p>

    <div class="screenshot-frame">
      <img src="${images.dispensing}" alt="Dispensary and Dispensing History Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Marhala (Step)</th>
          <th>Pharmacist Ka Kaam</th>
          <th>System Ki Hifazat (Safety Rule)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Nuskha Select Karein</strong></td>
          <td>Token ya MRN se prescription load karein</td>
          <td>System inventory ko lock karta hai taake aik hi dawai do counters par aik waqt na nikal jaye.</td>
        </tr>
        <tr>
          <td><strong>2. Auto Batch Allocation</strong></td>
          <td>System khud batch number aur shelf suggest karega</td>
          <td><strong>FEFO Pabandi:</strong> Pharmacist bina kisi thos waja ke doosra naya batch nahi nikaal sakta.</td>
        </tr>
        <tr>
          <td><strong>3. Sehat Card vs Cash Hisaab</strong></td>
          <td>Covered dawai aur agar koi copay ho to verify karein</td>
          <td>Paisa arithmetic (integer paisa) ke zariye hisaab hota hai, 1 paisa ka bhi farq nahi ata.</td>
        </tr>
        <tr>
          <td><strong>4. Raseed Print Karein</strong></td>
          <td>Urdu aur English thermal slip print karein</td>
          <td>Mareez ko Urdu mein khurak lene ka tareeqa raseed par print milta hai.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 8: MEDICINES CATALOGUE ==================== -->
  <div class="section-header">
    <h2>8. Dawaiyon Ki Master List (Medicines Catalogue)</h2>
    <span class="section-tag">Dawai Master</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Dawai Ka Formula, Brand Aur Sarkari Qeemat</h3>
    <p style="color: #64748b; font-size: 10px;">DRAP (Drug Regulatory Authority of Pakistan) ke qawaneen ke ain mutabiq approved catalogue.</p>

    <div class="screenshot-frame">
      <img src="${images.medicines}" alt="Medicines Catalogue Screenshot">
    </div>

    <div class="tip-box">
      <strong>💡 Catalogue Ka Ahem Usool:</strong> Har dawai ke sath uska Brand Name (jaisay <em>Augmentin</em>), Formula/Generic (<em>Amoxicillin + Clavulanic Acid</em>), Taqat (<em>625mg</em>), aur Packing (<em>Tablet/Syrup</em>) darj hota hai. Nayi dawai add karte waqt formula zaroor check karein.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 9: INVENTORY CONTROL ==================== -->
  <div class="section-header">
    <h2>9. Stock & Expiry Control (Inventory Management)</h2>
    <span class="section-tag">Warehouse Stock</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Batch Number Aur Expiry Date Ka Jaiza</h3>
    <p style="color: #64748b; font-size: 10px;">Har batch ka alag hisaab hota hai taake expire hone se 3 maah pehle alert mil jaye.</p>

    <div class="screenshot-frame">
      <img src="${images.inventory}" alt="Inventory Stock Levels Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Stock Rang (Color)</th>
          <th>Status Badge</th>
          <th>Fauri Karne Wala Kaam</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Sabz (Green)</strong></td>
          <td><span class="badge-pill badge-teal">In Stock</span></td>
          <td>Stock 30 din ki zaroorat se zyada hai. Mamool ke mutabiq dispense karein.</td>
        </tr>
        <tr>
          <td><strong>Peela (Yellow)</strong></td>
          <td><span class="badge-pill badge-amber">Reorder Level</span></td>
          <td>Stock 20 units ya us se kam reh gaya hai. Foran supplier ko order bhejein.</td>
        </tr>
        <tr>
          <td><strong>Surkh (Red)</strong></td>
          <td><span class="badge-pill badge-rose">Expiring &lt; 90 Days</span></td>
          <td>Dawai jald expire hone wali hai. Isay high-volume OPD counter par shift karein taake khatam hojaye.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 10: SUPPLIERS ==================== -->
  <div class="section-header">
    <h2>10. Suppliers & Dawai Ki Companies</h2>
    <span class="section-tag">Vendor Directory</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Approved Pharmaceutical Distributors Ka Record</h3>
    <p style="color: #64748b; font-size: 10px;">Sirf un companies se dawai khareedi ja sakti hai jinke paas valid Drug Sale License ho.</p>

    <div class="screenshot-frame">
      <img src="${images.suppliers}" alt="Suppliers Directory Screenshot">
    </div>

    <div class="step-box">
      <h4>🏢 Company Register Karte Waqt Zaroori Cheezein:</h4>
      <ul>
        <li><strong>Drug Sale License (DSL)</strong>: License number aur uski expiry date verify karein.</li>
        <li><strong>NTN & Sales Tax</strong>: FBR withholding tax deduction ke liye NTN active hona lazmi hai.</li>
        <li><strong>Cold Chain Certificate</strong>: Insulin aur vaccines ke liye cold chain gaadi ka certificate hona chahiye.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 11: PURCHASING & GRN ==================== -->
  <div class="section-header">
    <h2>11. Nayi Dawai Khareedna (Purchases & GRN)</h2>
    <span class="section-tag">Maal Wasool Karna</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Purchase Order (PO) Aur Goods Receiving Note (GRN)</h3>
    <p style="color: #64748b; font-size: 10px;">Order bhejne se le kar carton khol kar warehouse mein dakhil karne ka tareeqa.</p>

    <div class="screenshot-frame">
      <img src="${images.purchases}" alt="Purchase Orders and Inward Receiving Screenshot">
    </div>

    <div class="step-box">
      <h4>📦 Nayi Delivery Wasool Karne Ka Tareeqa:</h4>
      <ol>
        <li>Supplier ki delivery aane par physical dabbe check karein (Seal, Batch Number, Expiry).</li>
        <li>MedLedger mein <strong>Purchases</strong> khol kar mutalqa Purchase Order (PO) select karein.</li>
        <li><strong>"Log Goods Receipt (GRN)"</strong> click karein. Asal wasool shuda packs aur batch number darj karein.</li>
        <li>Invoice qeemat verify karke submit karein. System stock mein dawai khud-bakhud barha dega.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 12: SEHAT CARD CLAIMS ==================== -->
  <div class="section-header">
    <h2>12. Sehat Card Claims & Government Billing</h2>
    <span class="section-tag">Bila Muawaza Ilaaj</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">KP Sehat Sahulat Program Claims Management</h3>
    <p style="color: #64748b; font-size: 10px;">Dispensary se di gayi dawaiyon ke paise hukumat se wapis lene ka automated claim system.</p>

    <div class="screenshot-frame">
      <img src="${images.claims}" alt="Sehat Card Claims and Billing Screenshot">
    </div>

    <table class="guide-table">
      <thead>
        <tr>
          <th>Claim Status</th>
          <th>Badge Ka Rang</th>
          <th>Iska Kya Matlab Hai Aur Kya Karna Hai?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Under Review</strong></td>
          <td><span class="badge-pill badge-amber">Review Mein</span></td>
          <td>Dispensary se claim ban gaya hai. Hospital ka Claims Officer isay audit kar raha hai.</td>
        </tr>
        <tr>
          <td><strong>Submitted</strong></td>
          <td><span class="badge-pill badge-blue">Submitted</span></td>
          <td>Sehat Card portal ko bhej diya gaya hai. TPA panel iski manzoori dega.</td>
        </tr>
        <tr>
          <td><strong>Settled / Paid</strong></td>
          <td><span class="badge-pill badge-teal">Paid / Ada Ho Gaya</span></td>
          <td>Hukumat ne claim ke paise DHQ Hospital Kohat ke account mein transfer kar diye hain.</td>
        </tr>
        <tr>
          <td><strong>Rejected</strong></td>
          <td><span class="badge-pill badge-rose">Rejected</span></td>
          <td>Doctor ke nuskhe mein koi kami thi. Notes theek karke dobara submit karein.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 13: FINANCIAL REPORTS ==================== -->
  <div class="section-header">
    <h2>13. Maliyati Reports & Stock Hisaab Kitaab</h2>
    <span class="section-tag">Audit & Accounts</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Dispensary Ka Rozana Ka Hisaab Aur Stock Audit</h3>
    <p style="color: #64748b; font-size: 10px;">Hospital audit, stock ke sarmaye ka jaiza aur Excel export ke zariye reports tayar karein.</p>

    <div class="screenshot-frame">
      <img src="${images.reports}" alt="Financial and Audit Reports Screenshot">
    </div>

    <div class="step-box">
      <h4>📊 Ahem Reports Jo Yahan Se Milti Hain:</h4>
      <ul>
        <li><strong>Daily Cash vs Sehat Card Summary</strong>: Cash counter aur Sehat Card ka alag alag hisaab.</li>
        <li><strong>Stock Valuation Report</strong>: Hospital ke warehouse mein kitne rupay ki dawai moojood hai.</li>
        <li><strong>Expiry Loss Prevention Audit</strong>: Kon kon sa batch jald zaya ho sakta hai uski report.</li>
        <li><strong>CSV / Excel Download</strong>: Health Department KPK ko bhejney ke liye 1 click par Excel file download karein.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 14: SECURITY & ROUTINE ==================== -->
  <div class="section-header">
    <h2>14. Security SOPs & Rozana Shift Ka Tareeqa</h2>
    <span class="section-tag">Rozana Ka Mamool</span>
  </div>

  <div class="feature-card avoid-break">
    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">DHQ Hospital Kohat Pharmacy Standard Operating Procedure</h3>
    <p style="color: #64748b; font-size: 10px;">Subha, dopahar aur raat ki duty walay staff ke liye lazmi hidayat.</p>

    <table class="guide-table">
      <thead>
        <tr>
          <th style="width: 25%;">Shift Ka Waqt</th>
          <th style="width: 35%;">Dispensary Ka Kaam</th>
          <th style="width: 40%;">System Par Tasdeeq</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Subha Duty (08:00 AM)</strong></td>
          <td>Apne user se login karein. Dashboard par Priority Alerts dekhein. Low stock items check karein.</td>
          <td>Emergency cupboard ki dawaiyan MedLedger count ke sath match karein.</td>
        </tr>
        <tr>
          <td><strong>Dopahar Shift</strong></td>
          <td>OPD aur Ward prescriptions ko FEFO ke mutabiq dispense karein. Sehat Card CNIC match karein.</td>
          <td>Bina CNIC check kiye Sehat Card par dawai dispense na karein.</td>
        </tr>
        <tr>
          <td><strong>Shaam Handover (04:00 PM)</strong></td>
          <td>Reports se shift cash summary print karein. Aglay pharmacist ko charge handover karein.</td>
          <td>Check karein koi Sehat Card claim pending to nahi reh gaya.</td>
        </tr>
      </tbody>
    </table>

    <div class="step-box" style="margin-top: 15px;">
      <h4>🛡️ Data Ki Hifazat Aur Transparency:</h4>
      <ul>
        <li><strong>Audit Trail</strong>: Har dawai nikaalne, stock change karne aur claim bhejne par staff ka naam aur waqt record hota hai.</li>
        <li><strong>Integer Paisa Arithmetic</strong>: Tamam hisaab paisa units mein hota hai taake audit mein aadhay paisay ka bhi farq na aye.</li>
        <li><strong>Row-Level Security (RLS)</strong>: Mareezon ka medical data aur CNIC database mein fully encrypted hota hai.</li>
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
console.log(`Saved Roman Urdu HTML manual to: ${OUTPUT_HTML}`);

// Also copy to public/docs
if (!fs.existsSync(PUBLIC_DOCS_DIR)) {
  fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });
}
fs.copyFileSync(OUTPUT_HTML, path.join(PUBLIC_DOCS_DIR, 'MedLedger_User_Manual.html'));

async function generatePDF() {
  console.log('Launching Chrome to compile HTML into publication PDF in Roman Urdu...');
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
        <span>MedLedger — DHQ Hospital Kohat | Official User Manual (Roman Urdu)</span>
        <span>Safa <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  console.log(`SUCCESS: PDF successfully generated at: ${OUTPUT_PDF}`);

  // Copy PDF to public/docs as well
  fs.copyFileSync(OUTPUT_PDF, path.join(PUBLIC_DOCS_DIR, 'MedLedger_User_Manual.pdf'));
  console.log('Copied PDF and HTML to public/docs/');
}

generatePDF().catch(console.error);
