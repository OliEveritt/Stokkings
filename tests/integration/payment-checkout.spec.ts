import { test, expect } from '@playwright/test';

test.describe('Payment Checkout Flow', () => {
  const BASE_URL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  // UAT 1: Successful payment
  test('should complete payment and update contribution status to confirmed', async ({ page }) => {
    // Navigate to contributions page
    await page.goto(`${BASE_URL}/contributions`);
    
    // Find a pending contribution and click Pay Now
    await page.click('text=Pay Now');
    
    // Wait for redirect to Yoco checkout (mock)
    await page.waitForURL('https://pay.yoco.com/checkout/*');
    
    // Simulate successful payment (mock)
    await page.goto(`${BASE_URL}/payment/success?checkoutId=ch_abc123`);
    
    // Should show success message
    await expect(page.locator('text=Payment successful')).toBeVisible();
    
    // Return to contributions page
    await page.goto(`${BASE_URL}/contributions`);
    
    // Status should be "confirmed" and Pay Now button should not appear
    await expect(page.locator('text=confirmed')).toBeVisible();
    await expect(page.locator('text=Pay Now')).not.toBeVisible();
  });

  // UAT 2: Cancelled payment
  test('should show cancellation message and keep contribution pending', async ({ page }) => {
    await page.goto(`${BASE_URL}/contributions`);
    await page.click('text=Pay Now');
    
    // Simulate cancellation
    await page.goto(`${BASE_URL}/payment/cancel?checkoutId=ch_abc123`);
    
    await expect(page.locator('text=Payment was cancelled')).toBeVisible();
    
    await page.goto(`${BASE_URL}/contributions`);
    await expect(page.locator('text=pending')).toBeVisible();
    await expect(page.locator('text=Pay Now')).toBeVisible();
  });

  // UAT 3: Failed payment
  test('should show error message and keep contribution pending', async ({ page }) => {
    await page.goto(`${BASE_URL}/contributions`);
    await page.click('text=Pay Now');
    
    // Simulate payment failure
    await page.goto(`${BASE_URL}/payment/failure?checkoutId=ch_abc123`);
    
    await expect(page.locator('text=Payment failed')).toBeVisible();
    
    await page.goto(`${BASE_URL}/contributions`);
    await expect(page.locator('text=pending')).toBeVisible();
    await expect(page.locator('text=Pay Now')).toBeVisible();
  });

  // UAT 4: Already paid contribution
  test('should not show Pay Now button for confirmed contributions', async ({ page }) => {
    await page.goto(`${BASE_URL}/contributions`);
    
    // Find a confirmed contribution
    const confirmedRow = page.locator('tr:has-text("confirmed")');
    await expect(confirmedRow.locator('text=Pay Now')).not.toBeVisible();
  });
});
