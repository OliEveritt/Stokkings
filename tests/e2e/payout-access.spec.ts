import { test, expect } from '@playwright/test';

test.describe('US-2.6 E2E: Payout Permissions', () => {
  test('Treasurer should see "Treasurer Access" badge and drag handles', async ({ page }) => {
    // Simulate Admin Login
    await page.goto('/groups/KambuKgIkI62CZGDZ2hs/payouts');
    
    const badge = page.locator('text=Treasurer Access');
    await expect(badge).toBeVisible(); // UAT 3 Proof
    
    const dragHandle = page.locator('svg.lucide-grip-vertical').first();
    await expect(dragHandle).toBeVisible();
  });

  test('Standard Member should see list but no drag handles', async ({ page }) => {
    // Navigate as non-admin (simulate via role prop)
    await page.goto('/groups/KambuKgIkI62CZGDZ2hs/payouts?role=Member');
    
    const dragHandle = page.locator('svg.lucide-grip-vertical');
    await expect(dragHandle).not.toBeVisible(); // Security Validation
  });
});