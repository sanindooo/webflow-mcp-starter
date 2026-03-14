import { test, expect } from '@playwright/test';

test('capture hero component', async ({ page }) => {
  await page.goto('/untitled-2', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const component = page.locator('.section_hero');
  await component.waitFor({ state: 'visible' });

  // Capture component screenshot for Claude to compare against Figma
  await component.screenshot({ path: 'test-results/hero-current.png' });
});

test('hero regression check', async ({ page }) => {
  await page.goto('/untitled-2', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const component = page.locator('.section_hero');
  await component.waitFor({ state: 'visible' });

  // Regression: compare against previous Webflow baseline (not Figma)
  await expect(component).toHaveScreenshot('hero.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});
