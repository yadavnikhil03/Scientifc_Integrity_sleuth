import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Upload and analyze flow', () => {
  test('uploads sample image and shows results', async ({ page }) => {
    const base = globalThis.process?.env?.PW_BASE_URL || 'http://localhost:5173';

    await page.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'online',
          version: '1.0.4',
          uptime: 12.34,
        }),
      });
    });

    await page.route('**/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          filename: 'sample.svg',
          filesize: 201,
          status: 'completed',
          timestamp: Date.now() / 1000,
          overall_score: 0.71,
          findings: [
            {
              id: 'ANOMALY_1837',
              type: 'Splicing Artifact',
              confidence: 0.932,
              bbox: [99, 117, 99, 197],
            },
            {
              id: 'ANOMALY_9208',
              type: 'Splicing Artifact',
              confidence: 0.753,
              bbox: [134, 90, 183, 165],
            },
          ],
        }),
      });
    });

    await page.goto(base);

    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, 'fixtures', 'sample.svg'));

    await expect(page.getByText('sample.svg', { exact: true })).toBeVisible({ timeout: 2000 });

    await page.getByRole('button', { name: /Initialize Scan/i }).click();

    await expect(page.getByText('Integrity coefficient')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Anomalies detected')).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate lab report/i })).toBeVisible();
  });
});
