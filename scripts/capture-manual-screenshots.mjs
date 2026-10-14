import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'https://medledger-tau.vercel.app';
const OUTPUT_DIR = path.resolve('..', 'docs', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('Launching Chrome to capture live MedLedger screenshots...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  const pagesToCapture = [
    { name: '01-dashboard.png', path: '/', waitSelector: 'h1' },
    { name: '05-patients.png', path: '/patients', waitSelector: 'table, h1' },
    { name: '06-admissions.png', path: '/admissions', waitSelector: 'table, h1' },
    { name: '07-prescriptions.png', path: '/prescriptions', waitSelector: 'table, h1' },
    { name: '08-dispensing.png', path: '/dispensing', waitSelector: 'table, h1' },
    { name: '09-medicines.png', path: '/medicines', waitSelector: 'table, h1' },
    { name: '10-inventory.png', path: '/inventory', waitSelector: 'table, h1' },
    { name: '11-suppliers.png', path: '/suppliers', waitSelector: 'table, h1' },
    { name: '12-purchases.png', path: '/purchases', waitSelector: 'table, h1' },
    { name: '13-claims.png', path: '/claims', waitSelector: 'table, h1' },
    { name: '14-reports.png', path: '/reports', waitSelector: 'h1' },
  ];

  for (const item of pagesToCapture) {
    console.log(`Capturing: ${item.name} (${item.path})`);
    try {
      await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
      const filePath = path.join(OUTPUT_DIR, item.name);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved: ${filePath}`);
    } catch (err) {
      console.error(`Failed ${item.name}:`, err.message);
    }
  }

  // Interactive captures:
  // 1. Search modal
  console.log('Capturing: 02-dashboard-search.png');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const searchBtn = await page.$('button[aria-label="Search shortcut"]');
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '02-dashboard-search.png') });
    }
  } catch (err) {
    console.error('Failed search modal:', err.message);
  }

  // 2. Notifications dropdown
  console.log('Capturing: 03-dashboard-notifications.png');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const notifBtn = await page.$('button[aria-label="Open notifications"]');
    if (notifBtn) {
      await notifBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '03-dashboard-notifications.png') });
    }
  } catch (err) {
    console.error('Failed notifications dropdown:', err.message);
  }

  // 3. New Version Available update prompt
  console.log('Capturing: 04-update-notification.png');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      if (typeof window.__triggerUpdateAvailable === 'function') {
        window.__triggerUpdateAvailable();
      } else {
        window.dispatchEvent(new CustomEvent('medledger:update-available'));
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-update-notification.png') });
  } catch (err) {
    console.error('Failed update notification:', err.message);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
