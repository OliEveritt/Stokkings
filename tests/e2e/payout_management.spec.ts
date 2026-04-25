import { test, expect } from '@playwright/test';

test('US 2.6: Treasurer reorders the payout schedule', async ({ page }) => {
  await page.goto('/payouts');
  // Check if the list is visible (UAT 1)
  await expect(page.locator('table')).toBeVisible();
  
  // Click the reorder button (UAT 2)
  const moveDownBtn = page.locator('button[aria-label="Move Down"]').first();
  await moveDownBtn.click();

  // Verify success message
  await expect(page.locator('text=Schedule updated')).toBeVisible();
});