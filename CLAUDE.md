# Webflow Automation Pipeline

This project automates Figma-to-Webflow website building with visual verification via Playwright.

## Prerequisites

**Style Guide page required.** Every Webflow project must have a `/style-guide` page with foundational styles before any component building begins. This page is cloned from the Relume starter template (or a minimal derivative) and then customised with project-specific tokens. The automation **verifies** the style guide exists and **updates variables/styles** to match the Figma design — it does NOT create the page from scratch.

See `docs/reference/style-guide.md` for what the style guide must contain.

## Pipeline Loop

1. **Export Assets** — `/export-assets` extracts images, icons, logos from Figma via REST API
2. **Verify** — Confirm `/style-guide` page exists with foundational styles, variables, and classes
3. **Sync Tokens** — Extract Figma tokens and update Webflow variables + styles to match
4. **Upload Assets** — Upload exported assets to Webflow asset library via Data API
5. **Read** — Figma MCP extracts component design specs
6. **Build** — Webflow MCP creates elements with correct structure and classes (using asset URLs from manifest)
7. **Capture** — Playwright screenshots the live Webflow page
8. **Compare** — Claude vision compares Figma reference vs Webflow screenshot
9. **Iterate** — Fix issues via Webflow MCP, re-capture, re-compare (max 5x)
10. **Post-build** — `/asset-metadata` for alt text, `/update-seo` for page SEO

## Class Naming Conventions (Client-First adapted)

### Structure
- **Section wrapper:** `section_component-name` (e.g., `section_two-img-imba`)
- **Component elements:** `component-name_element` with underscore separator (e.g., `two-img-imba_small-side`, `two-img-imba_header`)
- **Modifiers:** `is-` prefix (e.g., `is-2`, `is-animated`, `is-link`, `is-decor`)

### Utility Classes
- **Layout containers:** `container-large` (80rem), `container-medium` (64rem), `container-small` (48rem), `container-xl` (alias for container-large)
- **Horizontal padding:** `padding-global` — fixed **2rem** left/right (NOT 5%). Applied to the wrapper div inside sections.
- **Vertical padding:** `padding-section-large` (7rem), `padding-section-medium` (5rem), `padding-section-small` (3rem) — responsive, see `breakpoints.md`. Applied as combo class on same element as padding-global.
- **Typography:** `heading-style-h1` through `heading-style-h6`, `text-size-large`, `text-size-medium`, `text-size-regular`, `text-size-small`, `text-rich-text`
- **Text weight:** `text-weight-xbold`, `text-weight-bold`, `text-weight-semibold`, `text-weight-medium`, `text-weight-normal`, `text-weight-light`
- **Text alignment:** `text-align-left`, `text-align-center`, `text-align-right`
- **Buttons:** `button` (base) + `is-secondary`, `is-ghost`, `is-outline`, `is-link`, `is-text`, `is-small`, `is-icon`, `is-alternate` (combo modifiers)
- **Images:** `u-image`
- **Responsive visibility:** `hide`, `hide-tablet`, `hide-mobile-landscape`, `hide-mobile-portrait`

### Design Variables

Managed via Webflow's `variable_tool`. The Relume starter template ships with its own variable collections — the automation **updates existing variables** to match Figma tokens rather than creating from scratch.

- **Colors collection:** `color-primary`, `color-secondary`, `color-accent`, `color-neutral-{900,700,500,300,100,0}`, `color-success`, `color-error`, `color-warning`, `color-info`
- **Spacing collection:** `spacing-{xxl,xl,lg,md,sm,xs,xxs}`
- See `docs/reference/style-guide.md` for default values and responsive scales

**Important:** Always query existing variable collections first (`variable_tool → get_variable_collections`). Map Relume's existing variable names to the project conventions before creating new ones — prefer updating over creating duplicates.

### Semantic HTML (mandatory)
- `<section>` for page sections
- `<article>` for component wrappers (NOT divs)
- `<figure>` for images
- `<header>` for heading areas
- `<footer>` for CTA areas
- Proper heading hierarchy (`<h1>`, `<h2>`, etc.)

### Accessibility
- `aria-label` on headings and text elements with full readable text
- GSAP SplitText handles word-by-word animation at runtime — the automation does NOT create split divs

### Custom Attributes
- `data-animation-general` — section animation trigger
- `data-animation-order` — animation sequencing (0, 1, 2, 3...)
- `mq="mob"` / `mq="desk"` — responsive visibility
- `button-function` / `button-function-arg1` / `button-function-arg2` — button behavior
- `data-eapps-font-size` / `data-eapps-line-height` — responsive font scaling

## Asset Pipeline

Images, icons, and logos are exported from Figma and uploaded to Webflow via REST API scripts in `scripts/api/`. The pipeline is tracked by `assets/asset-manifest.json`.

### Workflow
1. `pnpm run export-assets <fileKey> <nodeId>` — exports from Figma to `assets/`
2. `pnpm run upload-assets` — uploads to Webflow asset library (dedup by MD5 hash)
3. `pnpm run update-metadata --dry-run` — audit assets missing alt text
4. Build-component reads `webflowUrl` from manifest when setting image sources

### Skills
- `/export-assets` — full Figma export + Webflow upload combo
- `/asset-metadata` — generate alt text via Claude vision
- `/update-seo` — generate page titles, descriptions, Open Graph tags

### API Tokens
- `FIGMA_API_TOKEN` — Personal access token, expires every 90 days. Scope: `file_content:read`
- `WEBFLOW_API_TOKEN` — Site or workspace API token
- `WEBFLOW_SITE_ID` — Found in Site Settings > General

### Precise Style Extraction
`pnpm run extract-styles <fileKey> <nodeId>` — outputs exact CSS values (in rem) from Figma nodes. Use when the MCP's Tailwind approximation doesn't match the design.

## Custom Code Delivery

All custom JS lives in `scripts/` (global + per-component), served via **jsDelivr CDN** from GitHub release tags, injected into Webflow via `/custom-code-management` skill. See `.claude/skills/custom-code-management/SKILL.md` for full workflow. Registry: `scripts/manifest.json`. Local dev: `pnpm dev` (port 3000).

## Automation Boundary

### What the automation handles
- HTML structure, class names, content, images, links
- Custom data attributes
- Semantic elements and accessibility attributes

### What GSAP handles at runtime (NOT automated)
- Text splitting animations (SplitText)
- Clip-path reveals
- Scroll-triggered effects
- `aria-hidden="true"` on split text wrappers

## Component Variants
- Use `is-` modifier classes for variants, NOT separate components
- Example: `two-img-imba_component` + `is-2` for the reversed layout

## Visual Testing
- Playwright captures Webflow screenshots at 1440x900 viewport
- Claude vision compares against Figma reference (primary)
- Playwright `toHaveScreenshot()` for regression between iterations (secondary)
- Baseline URL: configured in `playwright.config.ts`

## Webflow MCP Notes
- Element Builder limited to 3 nesting levels per operation — use multiple sequential operations for deeper structures
- Designer API requires Webflow Designer open + companion app running
- Images uploaded via `/export-assets` skill or `pnpm run upload-assets` (MCP can't upload directly)
- Publish via `sites-publish` after building, then wait before screenshotting

### MCP Limitations (what it CANNOT do)
- **Rich text child styling** — Can apply a class to the rich text container, but cannot style nested element types (All H2s, All Paragraphs, etc.) within it. Must be done manually in Designer or pre-set in the Relume template.
- **Form elements** — Cannot create actual FormInput, FormTextarea, FormSelect elements. Creates DivBlocks that look like inputs. Real form elements must come from the template.
- **Inline styles on specific elements** — Limited ability to set per-element overrides; prefer combo classes instead.
- **Rich text block content** — Cannot programmatically add/edit content inside a RichText element.

These limitations are why the Style Guide page must be pre-built from a template (Relume) rather than generated from scratch.
