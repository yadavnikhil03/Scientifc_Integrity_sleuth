import { devices } from '@playwright/test';
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    baseURL: (globalThis.process && globalThis.process.env && globalThis.process.env.PW_BASE_URL) || 'http://localhost:5173',
  },
  webServer: (globalThis.process && globalThis.process.env && globalThis.process.env.PW_BASE_URL)
    ? undefined
    : {
        command: 'npx vite preview --port 5173',
        port: 5173,
        timeout: 120000,
        reuseExistingServer: true,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
};

export default config;
