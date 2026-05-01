import { test, expect } from '@playwright/test';

test.describe('US-2.1: Onboarding Flow E2E', () => {

  // Pre-condition: Authenticate before each test to bypass the login redirect
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Using verified credentials: uno@gmail.com / 123456789
    await page.locator('div').filter({ hasText: /^Email Address$/ }).getByRole('textbox').fill('uno@gmail.com');
    await page.locator('div').filter({ hasText: /^Password$/ }).getByRole('textbox').fill('123456789');
    
    await page.getByRole('button', { name: "Sign In" }).click();
    
    // Increase timeout to 15s to allow for Firebase/network lag
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    
    // Ensure the dashboard has loaded by checking for the header
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('UAT 1: Admin sends invite and it appears in Audit Trail', async ({ page }) => {
    await page.goto('/groups/5OH8mq7aM4oPJVSdJ7Zo/invite'); 

    await page.getByPlaceholder('new.member@wits.ac.za').fill('tester@wits.ac.za');
    await page.getByRole('button', { name: /send invitation/i }).click();

    // Verify the email appears in the list
    await expect(page.getByText('tester@wits.ac.za')).toBeVisible();
    
    // FIX: Use a case-insensitive text locator instead of a CSS class
    // This matches the 'pending' text found in the snapshot
    await expect(page.getByText(/pending/i).first()).toBeVisible();
  });

  test('UAT 3: Error shown when inviting existing member', async ({ page }) => {
    // Listener must be active before the action is triggered
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('already been invited');
      await dialog.dismiss();
    });

    // Navigate directly to the group invite path
    await page.goto('/groups/5OH8mq7aM4oPJVSdJ7Zo/invite');
    
    // Attempting to invite an existing member from your audit trail
    await page.getByPlaceholder('new.member@wits.ac.za').fill('testyou@gmail.com');
    await page.getByRole('button', { name: /send invitation/i }).click();
  });

});