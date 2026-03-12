import { test, expect } from '@playwright/test';

test('capture two-img-imba component', async ({ page }) => {
  await page.goto('/poc-test');
  await page.waitForLoadState('networkidle');

  const component = page.locator('.section_two-img-imba');
  await component.waitFor({ state: 'visible' });

  // Capture component screenshot for Claude to compare against Figma
  await component.screenshot({ path: 'test-results/two-img-imba-current.png' });
});

test('two-img-imba regression check', async ({ page }) => {
  await page.goto('/poc-test');
  await page.waitForLoadState('networkidle');

  const component = page.locator('.section_two-img-imba');
  await component.waitFor({ state: 'visible' });

  // Regression: compare against previous Webflow baseline (not Figma)
  await expect(component).toHaveScreenshot('two-img-imba.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});
