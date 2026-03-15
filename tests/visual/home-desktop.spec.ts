import { test } from '@playwright/test';

test('capture home-desktop full page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Full page screenshot for comparison against Figma reference
  await page.screenshot({
    path: 'test-results/home-desktop-current.png',
    fullPage: true,
  });
});
