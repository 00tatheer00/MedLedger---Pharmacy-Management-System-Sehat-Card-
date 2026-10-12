import { test, expect } from '@playwright/test';

test('application loads and shows the MedLedger page', async ({ page }) => {
  await page.goto('/');
  // This is a placeholder test. It will be updated as the application develops.
  await expect(page).toHaveTitle(/MedLedger/);
});
