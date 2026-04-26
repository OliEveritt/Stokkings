import { test, expect } from '@playwright/test';

test('homepage redirects to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/.*\/login/);
});

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('h2')).toContainText('Stokkings');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});