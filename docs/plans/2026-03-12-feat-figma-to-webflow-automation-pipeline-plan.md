---
title: "feat: Figma-to-Webflow Automation Pipeline"
type: feat
status: active
date: 2026-03-12
---

# Figma-to-Webflow Automation Pipeline

## Overview

A single-agent automation pipeline orchestrated by Claude Code that reads a Figma design via Figma MCP, builds it in Webflow via Webflow MCP, then visually verifies the output with Playwright — iterating until the output matches the design within a configurable threshold.

**POC scope:** Build one `two-img-imba` component end-to-end.

**Brainstorm:** `docs/brainstorms/2026-03-12-webflow-automation-pipeline-brainstorm.md`

## Problem Statement

Building Webflow pages from Figma designs is a manual, repetitive process: interpret the design, create elements, apply classes, set content, check the result, fix mismatches. Each step follows predictable patterns — making it a strong candidate for MCP-driven automation with visual verification.

## Proposed Solution

A 4-phase loop running in a single Claude Code session:

```
┌──────────────────────────────────────────────────────────────┐
│                     Claude Code Session                       │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐  ┌──────────┐ │
│  │  1. READ  │──▶│ 2. BUILD │──▶│3. CAPTURE │──▶│4. COMPARE│ │
│  │ Figma MCP │   │Webflow   │   │Playwright │  │Claude    │ │
│  │ screenshot│   │  MCP     │   │screenshot │  │  vision  │ │
│  └──────────┘   └──────────┘   └───────────┘  └────┬─────┘ │
│                                                      │       │
│                                      ┌───────────────┤       │
│                                      │               │       │
│                                   MATCH ✓         ISSUES ✗   │
│                                      │               │       │
│                                   Done!        ┌─────▼─────┐ │
│                                                │5. ITERATE │ │
│                                                │Webflow MCP│─┐│
│                                                │  fix + re-││││
│                                                │  capture  │ ││
│                                                └───────────┘ ││
│                                                      ▲  ≤5x  ││
│                                                      └───────┘│
└──────────────────────────────────────────────────────────────┘
```

## Technical Approach

### Architecture

**Single-agent, no custom code for the POC.** Claude Code orchestrates everything via MCP tools and Playwright CLI. The "code" lives in:

1. **`CLAUDE.md`** — conventions, class naming rules, component mapping
2. **`playwright.config.ts`** — visual comparison settings
3. **`tests/visual/`** — Playwright test files for screenshot comparison
4. **`docs/component-maps/`** — Figma-to-Webflow element mapping per component

No orchestration scripts, no custom build pipeline, no server. Claude Code IS the orchestrator.

### Prerequisites (manual, one-time)

Before the pipeline can run:

1. **Webflow MCP** added to Claude Code and authenticated
2. **Figma MCP** added to Claude Code and authenticated
3. **Webflow Designer** open with companion app running
4. **Figma** open with the target frame selected
5. **Images pre-uploaded** to Webflow asset library (MCP can't upload images)
6. **Client-First utility classes** already exist in the Webflow project (they do — existing site)
7. **Node.js 22.3.0+** installed (required by Webflow MCP)
8. **Playwright** installed in the project

### Implementation Phases

#### Phase 1: Project Setup & MCP Discovery

**Goal:** Get the repo initialized, MCP servers connected, and probe their capabilities.

**Tasks:**

- [x] Initialize `package.json` with pnpm
- [x] Install Playwright (`pnpm create playwright`)
- [x] Add Webflow MCP to Claude Code:
  ```bash
  claude mcp add --transport http webflow https://mcp.webflow.com/mcp
  ```
- [x] Add Figma MCP to Claude Code:
  ```bash
  claude mcp add --transport http figma https://mcp.figma.com/mcp
  ```
- [x] Authenticate both MCP servers via `/mcp` in Claude Code
- [x] Open Webflow Designer + companion app
- [x] Create `CLAUDE.md` with class naming conventions (from brainstorm doc)
- [x] Create `.gitignore` (node_modules, test-results, playwright-report)

**Discovery spikes (answer open questions):**

- [ ] **Spike 1 — Webflow element creation:** Create a single `<section>` with a nested `<article>` > `<figure>` > `<img>` via Webflow MCP. Confirm it returns element IDs for subsequent operations. Test the 3-level nesting limit.
- [ ] **Spike 2 — Custom attributes:** Set `data-animation-general`, `mq="mob"`, `button-function` attributes on created elements. Confirm which work and which don't.
- [ ] **Spike 3 — Style application:** Apply existing Client-First classes (`padding-global`, `container-xl`) to created elements via Webflow MCP.
- [ ] **Spike 4 — Figma data extraction:** Call `get_design_context`, `get_metadata`, `get_variable_defs`, and `get_screenshot` on the target Figma frame. Document what each returns.
- [ ] **Spike 5 — Publish & screenshot cycle:** After creating elements, publish via `sites-publish`, then screenshot the `.webflow.io` staging URL with Playwright. Confirm the full cycle works.

**Output:** `docs/spike-results.md` documenting what works and what doesn't.

**Go/no-go gate:** After spikes are complete, review results and decide:
- **Proceed** — all critical capabilities confirmed (element creation, nesting, classes, attributes)
- **Adapt** — some capabilities missing, adjust Phase 3 build sequence to work around limitations
- **Abort** — fundamental blocker (e.g., can't set semantic tags at all), rethink approach

**Success criteria:** Can create a nested semantic HTML element in Webflow via MCP, apply a class to it, and screenshot it with Playwright.

#### Phase 2: Component Mapping

**Goal:** Create the explicit mapping from the Figma `two-img-imba` component to Webflow elements.

**Tasks:**

- [ ] Select the `two-img-imba` frame in Figma
- [ ] Call Figma MCP `get_design_context` and `get_metadata` to extract the component structure
- [ ] Call `get_variable_defs` to extract design tokens (colors, fonts, spacing)
- [ ] Call `get_screenshot` to capture the reference image
- [ ] Create `docs/component-maps/two-img-imba.md` mapping every Figma layer to its Webflow equivalent:

```markdown
# two-img-imba Component Map

## Element Tree

| Figma Layer | Webflow Tag | Classes | Attributes |
|-------------|-------------|---------|------------|
| Frame: two-img-imba | `<section>` | `section_two-img-imba` | `data-animation-general=""` |
| > Container | `<div>` | `container-xl section-sizer` | |
| > > Padding | `<div>` | `padding-global padding-section-xl` | |
| > > > Component | `<article>` | `two-img-imba_component` | |
| ... | ... | ... | ... |

## Design Tokens
- Heading: [font, size, weight from Figma]
- Body: [font, size, weight from Figma]
- Colors: [hex values from Figma]
- Spacing: [values from Figma → utility class mapping]

## Images Required
- small image: [Webflow asset URL]
- large image: [Webflow asset URL]
```

- [ ] Pre-upload the two `two-img-imba` images to Webflow asset library
- [ ] Record the asset URLs/IDs for the component map

**Success criteria:** A complete, accurate element tree mapping that Claude can follow mechanically.

#### Phase 3: Build Pipeline

**Goal:** Claude reads the component map and builds the component in Webflow via MCP.

**Tasks:**

- [ ] Create a new blank page in Webflow via `pages` Data API for the POC test
- [ ] Implement the build sequence — Claude follows the component map and creates elements top-down:
  - **Operation 1:** Create `<section>` > `<div>.container-xl` > `<div>.padding-global` (3 levels)
  - **Operation 2:** Inside the padding div, create `<article>` > `<div>.small-side` > `<div>.small-side-inside` (3 levels)
  - **Operation 3:** Inside small-side-inside, create `<figure>` > `<img>` (2 levels)
  - **Operation 4:** Inside small-side-inside, create `<header>` > `<h2>` (2 levels), set text content and `aria-label`
  - **Operation 5:** Inside small-side-inside, create `<div>.content` > `<div>.text-rich-text` > `<p>` (3 levels), set text
  - **Operation 6:** Inside small-side-inside, create `<footer>` > `<a>.button.is-link` (2 levels), set href, text, SVG icon
  - **Operation 7:** Inside article, create `<div>.large-side` > `<figure>` > `<img>` (3 levels)
- [ ] Apply classes to all elements via Webflow MCP style tools
- [ ] Set custom attributes (`data-animation-general`, `data-animation-order`, `aria-label`, etc.)
- [ ] Set image sources from pre-uploaded assets
- [ ] Set text content for headings, paragraphs, button labels
- [ ] Publish the page via `sites-publish`

**Success criteria:** The `two-img-imba` component exists on the Webflow staging URL with correct structure, classes, content, and attributes.

#### Phase 4: Visual Testing

**Goal:** Verify the built component matches the Figma design.

**Two-layer comparison strategy:**

Figma and Chrome are fundamentally different rendering engines (different font rasterization, anti-aliasing, sub-pixel positioning). Pixel-level comparison between a Figma export and a browser render will always show large differences — even for a perfect build. So we use two complementary strategies:

1. **Claude vision comparison** (primary) — Claude sees both the Figma screenshot and the Webflow screenshot side by side, and reasons about structural/layout differences semantically ("heading is too large", "padding is wrong", "image is missing"). This is what drives the iteration loop.
2. **Playwright regression testing** (secondary) — `toHaveScreenshot()` captures the Webflow output as its OWN baseline after the first successful build. Subsequent iterations compare against the previous Webflow screenshot to confirm fixes don't break other things.

**Tasks:**

- [ ] Configure `playwright.config.ts`:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'https://stephens-mcp-test.webflow.io',
    viewport: { width: 1440, height: 900 },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] Create the screenshot capture test:

```typescript
// tests/visual/two-img-imba.spec.ts
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
```

- [ ] Save the Figma screenshot (from `get_screenshot`) to `test-results/two-img-imba-figma-reference.png`
- [ ] Run Playwright to capture the Webflow screenshot
- [ ] Claude compares both images (Figma reference vs. Webflow capture) using its vision capability
- [ ] Claude determines if the build is acceptable or identifies specific issues

**Success criteria:** Claude's vision analysis confirms the component structure, layout, and content match the Figma design — or identifies specific, actionable issues for iteration.

#### Phase 5: Iteration Loop

**Goal:** When Claude's visual analysis finds issues, fix them and re-verify.

**Tasks:**

- [ ] Claude reads both images: Figma reference + Webflow screenshot
- [ ] Claude identifies specific structural/layout/content differences (e.g., "the heading font size is too large", "the image aspect ratio is wrong", "padding between sections is too tight")
- [ ] Claude makes targeted Webflow MCP calls to fix the specific issues
- [ ] Claude re-publishes and re-captures the Webflow screenshot
- [ ] Claude re-compares against the Figma reference
- [ ] Repeat up to 5 times
- [ ] On iteration 5: output a summary of what was tried, what improved, and what remains mismatched
- [ ] After final accepted build: update the Playwright regression baseline (`--update-snapshots`) so future runs detect regressions

**Iteration tracking (prevents oscillation):**

Claude maintains a log within the session:
```
Iteration 1: Created component. Issues: heading too large, padding too wide.
Iteration 2: Fixed heading size. Issues: padding still off, image cropped differently.
Iteration 3: Fixed padding. Remaining: minor font rendering diff (expected, inherent to Figma vs browser).
→ ACCEPTED
```

**Success criteria:** The iteration loop converges — each iteration resolves identified issues, and Claude's vision analysis confirms the build matches the Figma design within acceptable tolerances.

## Acceptance Criteria

### Functional Requirements

- [ ] Figma MCP extracts design specs from a selected frame
- [ ] Webflow MCP creates a `two-img-imba` component with correct semantic HTML
- [ ] All Client-First classes are applied correctly
- [ ] Custom attributes (`data-animation-general`, `aria-label`, etc.) are set
- [ ] Images reference pre-uploaded Webflow assets
- [ ] Text content matches the Figma design
- [ ] Playwright screenshots the built component on the `.webflow.io` staging URL
- [ ] Visual comparison against Figma reference passes within threshold
- [ ] On failure, Claude iterates (max 5x) until pass or escalation

### Non-Functional Requirements

- [ ] Full loop (read + build + test) completes within a single Claude Code session
- [ ] No custom orchestration scripts — Claude Code is the orchestrator
- [ ] Convention rules encoded in `CLAUDE.md` for consistency across future runs

### Quality Gates

- [ ] Spike results documented before moving to Phase 2
- [ ] Component map reviewed before building
- [ ] Playwright test passes with Figma baseline

## Dependencies & Prerequisites

| Dependency | Status | Notes |
|------------|--------|-------|
| Webflow MCP server | Not configured | `claude mcp add` in Phase 1 |
| Figma MCP server | Configured in Cursor, not Claude Code | `claude mcp add` in Phase 1 |
| Playwright | Not installed | `pnpm create playwright` in Phase 1 |
| Node.js 22.3.0+ | Needs verification | Required by Webflow MCP |
| Existing Webflow site | Available | User has an existing site + Figma file |
| Images in Webflow library | Not uploaded | Manual upload in Phase 2 |
| Webflow Designer + companion app | Must be open during pipeline run | Manual prerequisite |
| Figma with frame selected | Must be open during pipeline run | Manual prerequisite |

## Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Webflow MCP can't create elements deeper than 3 levels | High | Medium | Multiple sequential operations with element ID references (tested in Spike 1) |
| Custom attributes not fully supported | Medium | Medium | Fall back to manual attribute setting post-build; document which attributes work in spike results |
| Figma screenshot ≠ browser render (font differences) | Low | High | Claude vision comparison handles this naturally — it reasons about structure/layout, not pixels. Playwright regression baselines use Webflow-to-Webflow comparison only |
| Webflow publish latency causes stale screenshots | Medium | Medium | Add wait/retry after publish before screenshotting |
| Element ID not returned by Webflow MCP | High | Low | If confirmed in spike, restructure to use element selectors/queries instead of ID references |
| Context window exhaustion on complex components | Medium | Low | POC is a single component; this becomes a concern only at page-scale |

## Key Open Questions (to resolve in Phase 1 spikes)

1. Does Webflow MCP return element IDs after creation?
2. Which custom attributes are supported via `setAttribute()` vs. `setCustomAttribute()`?
3. What does Figma MCP `get_design_context` return for a complex component? (code representation format)
4. What's the latency between `sites-publish` and changes appearing on `.webflow.io`?
5. Can Webflow MCP set text content with `aria-label` on the same element?

## File Structure

```
webflow-mcp-test/
├── CLAUDE.md                          # Convention rules for the agent
├── package.json                       # pnpm, Playwright dependency
├── playwright.config.ts               # Visual comparison config
├── .gitignore                         # node_modules, test-results, etc.
├── tests/
│   └── visual/
│       ├── two-img-imba.spec.ts       # Visual comparison test
│       └── two-img-imba.spec.ts-snapshots/
│           └── two-img-imba-chromium.png  # Figma baseline image
├── docs/
│   ├── brainstorms/
│   │   └── 2026-03-12-webflow-automation-pipeline-brainstorm.md
│   ├── plans/
│   │   └── 2026-03-12-feat-figma-to-webflow-automation-pipeline-plan.md
│   ├── component-maps/
│   │   └── two-img-imba.md            # Figma→Webflow element mapping
│   └── spike-results.md               # MCP capability discovery log
```

## References & Research

### Internal References
- Brainstorm: `docs/brainstorms/2026-03-12-webflow-automation-pipeline-brainstorm.md`
- Pier Point Playwright config: `/Users/sanindo/pier-point-webflow/playwright.config.ts`
- CEDOE CLAUDE.md pattern: `/Users/sanindo/granite-marketing-claude-orchastrator/CLAUDE.md`

### External References
- [Webflow MCP Server Overview](https://developers.webflow.com/mcp/reference/overview)
- [Webflow MCP Getting Started](https://developers.webflow.com/mcp/reference/getting-started)
- [Webflow Designer API: Elements](https://developers.webflow.com/designer/reference/elements-overview)
- [Webflow Designer API: setTag()](https://developers.webflow.com/designer/reference/dom-element/setTag)
- [Figma MCP Server Guide](https://help.figma.com/hc/en-us/articles/32132100833559)
- [Figma MCP Tools and Prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright toHaveScreenshot API](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1)
