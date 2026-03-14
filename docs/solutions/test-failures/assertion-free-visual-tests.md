---
title: "Playwright visual tests lacked assertions — tests always passed silently"
date: "2026-03-14"
category: "test-failures"
component: "tests/visual/navbar.spec.ts"
tags: ["playwright", "visual-regression", "assertions", "toHaveScreenshot", "test-reliability"]
severity: "medium"
time_to_resolve: "~30 minutes"
symptoms: "test:regression script ran navbar tests that always passed regardless of page content; no actual comparisons were performed"
root_cause: "screenshot() calls wrote files to disk but no expect(page).toHaveScreenshot() assertions were present to enforce pixel-diff thresholds"
---

# Playwright Visual Tests Lacked Assertions

## Problem

Both Playwright tests in `tests/visual/navbar.spec.ts` only captured screenshots to disk using `screenshot({ path: ... })` but never called `expect(...).toHaveScreenshot()`. The tests always "passed" because there was nothing to fail against. The `test:regression` npm script matched these tests but they asserted nothing.

Meanwhile, `playwright.config.ts` already configured `toHaveScreenshot` with `maxDiffPixelRatio: 0.02` and `threshold: 0.2` — infrastructure that was never exercised.

### Symptoms

- `pnpm test:regression` always passed regardless of page content
- `expect` was imported but never used
- No baseline snapshots existed in the repo
- Visual regression pipeline described in CLAUDE.md was non-functional

## Root Cause

Tests were written as capture utilities for the Claude vision comparison step (Step 5 of the pipeline loop) but were incorrectly treated as the only visual tests. No separate regression tests with actual Playwright assertions existed. The `screenshot({ path })` API only saves an image — it does not compare against a baseline.

## Solution

Separate the two concerns: keep capture tests for Claude vision workflows, and add dedicated regression tests with `toHaveScreenshot()` assertions. Share navigation/wait logic via `test.beforeEach`.

### Key Changes

**1. Extract shared setup into `beforeEach` and page slug to constant:**

```typescript
const NAVBAR_PAGE = '/untitled-2';

test.beforeEach(async ({ page }) => {
  await page.goto(NAVBAR_PAGE);
  await page.waitForLoadState('networkidle');
});
```

**2. Keep the capture test unchanged** (still used by Claude vision comparison):

```typescript
test('capture navbar component', async ({ page }) => {
  const navbar = page.locator('.navbar_component');
  await navbar.waitFor({ state: 'visible', timeout: 15000 });
  await navbar.screenshot({ path: 'test-results/navbar-current.png' });
});
```

**3. Add regression tests with `toHaveScreenshot()` and `@regression` tag:**

```typescript
test('regression navbar component @regression', async ({ page }) => {
  const navbar = page.locator('.navbar_component');
  await navbar.waitFor({ state: 'visible', timeout: 15000 });
  await expect(navbar).toHaveScreenshot('navbar-component.png');
});

test('regression navbar full page @regression', async ({ page }) => {
  await expect(page).toHaveScreenshot('navbar-fullpage.png', { fullPage: true });
});
```

### Why This Approach

- **Two distinct purposes coexist:** Capture tests produce images for Claude vision comparison (pipeline Step 5). Regression tests assert pixel-level stability between iterations (pipeline Step 6). Both are needed; neither replaces the other.
- **`@regression` tag** allows running only regression tests in CI (`--grep @regression`) without triggering capture-only tests.
- **`toHaveScreenshot()` activates Playwright's built-in snapshot diffing**, using the configured thresholds from `playwright.config.ts`.
- **`beforeEach` deduplication** ensures both capture and regression tests navigate identically.

## Prevention

### Patterns to Follow

- Every visual test file should have either `toHaveScreenshot()` assertions or an explicit `@capture` tag — never an ambiguous test that captures without asserting.
- Use `@regression` tag for assertion tests, `@capture` for capture-only tests. Untagged screenshot tests are treated as errors.
- Baseline screenshots are committed to the repo. On first run with `--update-snapshots`, review baselines visually before committing.

### Testing Checklist

- [ ] Run `pnpm test:regression` — confirm tests fail when baseline doesn't match
- [ ] Run `pnpm test:capture` — confirm capture tests produce files without assertions
- [ ] Verify `toHaveScreenshot()` is present in every regression test
- [ ] Confirm baseline screenshots exist before running regression in CI
- [ ] After Webflow changes, review Playwright HTML report diffs, then `--update-snapshots` only for intentional changes

### Template for New Component Visual Tests

```typescript
import { test, expect } from '@playwright/test';

const COMPONENT_PAGE = '/page-slug';

test.beforeEach(async ({ page }) => {
  await page.goto(COMPONENT_PAGE);
  await page.waitForLoadState('networkidle');
});

test('capture [component] @capture', async ({ page }) => {
  const component = page.locator('.component_selector');
  await component.waitFor({ state: 'visible', timeout: 15000 });
  await component.screenshot({ path: 'test-results/[component]-current.png' });
});

test('regression [component] @regression', async ({ page }) => {
  const component = page.locator('.component_selector');
  await component.waitFor({ state: 'visible', timeout: 15000 });
  await expect(component).toHaveScreenshot('[component]-desktop.png');
});
```

## Related

- **Config:** `playwright.config.ts` — `toHaveScreenshot` settings (`maxDiffPixelRatio: 0.02`, `threshold: 0.2`, `animations: 'disabled'`)
- **Existing pattern:** `tests/visual/two-img-imba.spec.ts` already had both capture + regression tests (this was the correct pattern to follow)
- **Pipeline docs:** CLAUDE.md Visual Testing section — two-layer strategy (Claude vision primary, Playwright regression secondary)
- **Open issue:** `todos/015-pending-p2-no-parameterized-test-capture.md` — test files hardcode page slugs; need parameterized capture for new components
- **Open issue:** `todos/006-pending-p2-hardcoded-sleep-cdn-propagation.md` — `sleep 10` before screenshot may cause stale captures
- **Spike 5:** `docs/spike-results.md` — publish-to-live latency still an open question
