import { test, expect } from '@playwright/test';

test.describe('Invitation User Journey', () => {
  test('Middleware should preserve token and groupId on redirect (UAT 2)', async ({ page }) => {
    const token = 'bfcf16d8-6063-48e6-86a0-041f20dbd9e0';
    const groupId = 'hNqx2yADNkbwixiBuQdA';

    // Simulate arriving at root with invite params
    await page.goto(`/?token=${token}&groupId=${groupId}`);

    // Verify redirect to sign-up with params intact
    await expect(page).toHaveURL(new RegExp(`/sign-up.*token=${token}`));
    await expect(page.locator('text=Accepting Invitation to Join Group')).toBeVisible();
  });
});