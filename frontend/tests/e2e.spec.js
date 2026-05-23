import { test, expect } from '@playwright/test';

test('homepage shows header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=SCIENTIFIC_INTEGRITY_SLEUTH')).toBeVisible({ timeout: 10000 });
});
