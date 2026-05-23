import { test, expect } from '@playwright/test';

test('homepage shows header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Forensic imaging control center')).toBeVisible();
});
