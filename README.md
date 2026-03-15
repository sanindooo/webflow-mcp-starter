# Figma-to-Webflow Pipeline

Automated design-to-build pipeline using **Claude Code**, **Figma MCP**, **Webflow MCP**, and **Playwright** visual testing.

Extracts designs from Figma, builds them in Webflow, captures screenshots, compares visually, and iterates until the output matches the design. Includes API utilities for asset export, upload, metadata generation, and SEO automation.

## How It Works

```
Figma Design → Export Assets → Extract Tokens → Sync to Webflow → Upload Assets → Build Components → Screenshot → Compare → Iterate
```

1. **Export Assets** — Extract images, icons, and logos from Figma via REST API
2. **Verify** — Confirm the Webflow project has a `/style-guide` page (Relume template)
3. **Sync Tokens** — Extract Figma design tokens and update Webflow variables/styles
4. **Upload Assets** — Upload exported assets to Webflow asset library via Data API
5. **Read** — Extract component specs from Figma via MCP
6. **Build** — Create elements in Webflow Designer via MCP
7. **Capture** — Playwright screenshots the live page at 1440x900
8. **Compare** — Claude vision compares Figma reference vs Webflow screenshot
9. **Iterate** — Fix issues, re-capture, re-compare (max 5 loops)
10. **Post-build** — Generate alt text, SEO metadata, and Open Graph tags

## Prerequisites

- [Claude Code](https://claude.com/claude-code) CLI installed
- [Webflow MCP](https://docs.webflow.com/docs/mcp) companion app running
- [Figma MCP](https://github.com/nicholasgriffintn/figma-mcp) configured
- Node.js 18+

## Setup

1. **Use this template** — click "Use this template" on GitHub

2. **Install dependencies:**
   ```bash
   pnpm install
   pnpm run setup  # installs Playwright browsers
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Webflow site URL, Figma API token, and Webflow API token
   ```

4. **Prepare your Webflow project:**
   - Clone the [Relume starter template](https://webflow.com/made-in-webflow/website/relume-library-styleguide) into your Webflow site
   - This provides the `/style-guide` page with form elements, rich text blocks, and foundational styles the automation needs

5. **Connect MCP servers:**
   - Open Webflow Designer with the MCP companion app active
   - Configure Figma MCP with your API key

6. **Start building:**
   ```bash
   claude
   # Then: /build-component
   ```

## Commands

### Claude Code Skills

| Command | Description |
|---|---|
| `/build-component` | Full pipeline — Figma design to Webflow build with visual verification |
| `/export-assets` | Export images, icons, and logos from Figma and upload to Webflow |
| `/asset-metadata` | Generate and apply alt text for Webflow assets using Claude vision |
| `/update-seo` | Generate and apply SEO metadata (titles, descriptions, OG tags) for Webflow pages |
| `/custom-code-management` | Manage custom JavaScript delivery via jsDelivr CDN |

### Scripts

| Command | Description |
|---|---|
| `pnpm run export-assets` | Export assets from Figma to local `assets/` directory |
| `pnpm run upload-assets` | Upload local assets to Webflow asset library |
| `pnpm run update-metadata` | Update alt text and display names for Webflow assets |
| `pnpm run extract-styles` | Extract precise CSS values from Figma nodes |
| `pnpm run update-seo` | Update page SEO metadata via Webflow API |
| `pnpm test:capture` | Capture screenshots of Webflow pages |
| `pnpm test:regression` | Run visual regression tests against baselines |
| `pnpm test:update-baseline` | Update screenshot baselines |
| `pnpm dev` | Serve custom scripts locally on port 3000 |

## Project Structure

```
├── .claude/skills/             # Claude Code skills (pipeline orchestration)
│   ├── build-component/        # Main Figma-to-Webflow pipeline skill
│   ├── custom-code-management/ # jsDelivr script delivery skill
│   ├── export-assets/          # Figma export + Webflow upload skill
│   ├── asset-metadata/         # Bulk alt text generation skill
│   └── update-seo/             # SEO metadata automation skill
├── scripts/
│   ├── api/                    # API utility scripts (Node.js)
│   │   ├── figma/              # Figma REST API scripts (export-assets, extract-styles)
│   │   ├── webflow/            # Webflow Data API scripts (upload, metadata, SEO)
│   │   └── lib/                # Shared API clients (figma-client, webflow-client, manifest)
│   ├── global/                 # Browser-side JS — loaded site-wide via jsDelivr
│   ├── components/             # Browser-side JS — loaded per-page via jsDelivr
│   └── manifest.json           # Custom code delivery manifest
├── assets/                     # Exported Figma assets (gitignored)
│   ├── images/                 # Photos, backgrounds
│   ├── icons/                  # SVG icons
│   ├── logos/                  # SVG/PNG logos
│   └── asset-manifest.json     # Asset pipeline tracking manifest
├── docs/
│   ├── reference/              # Token definitions, breakpoints, API utilities
│   ├── brainstorms/            # Design decision records
│   ├── plans/                  # Implementation plans
│   └── component-maps/         # Per-component build specs (generated)
├── tests/visual/               # Playwright visual regression tests
├── test-results/               # Screenshots (gitignored)
├── CLAUDE.md                   # Project conventions for Claude Code
├── playwright.config.ts        # Visual test configuration
└── package.json
```

## Key Conventions

- **Naming:** Client-First adapted — `section_component`, `component_element`, `is-modifier`
- **Buttons:** Base `.button` class + combo modifiers (`is-secondary`, `is-ghost`, `is-outline`, etc.)
- **Units:** All sizes in `rem`, longhand CSS only
- **Variables:** Colours and spacing managed via Webflow variable collections
- **Style Guide:** Relume template synced with Figma tokens — not generated from scratch

See [CLAUDE.md](CLAUDE.md) for full conventions and [docs/reference/style-guide.md](docs/reference/style-guide.md) for token definitions.

## API Utilities

The pipeline extends beyond MCP capabilities using direct REST API calls to both Figma and Webflow.

### What the APIs add (that MCPs can't do)

| Capability | API Used | MCP Gap Filled |
|---|---|---|
| **Asset export** — SVG icons, PNG images, original-quality photos | Figma REST API | MCP only provides screenshots, not individual asset files |
| **Asset upload** — 2-step presigned S3 upload to Webflow | Webflow Data API v2 | MCP cannot upload images to the asset library |
| **Alt text generation** — AI-generated descriptions applied in bulk | Webflow Data API v2 | MCP can read assets but not bulk-update metadata |
| **Precise style extraction** — exact font sizes, colors, spacing | Figma REST API | MCP returns Tailwind approximations, not exact values |
| **SEO metadata** — page titles, descriptions, Open Graph tags | Webflow Data API v2 | MCP cannot set page-level SEO fields |

### Authentication

The API utilities require two additional tokens in `.env`:

- **`FIGMA_API_TOKEN`** — Personal access token (expires every 90 days). Scope: `file_content:read`. Generate at [Figma Developer Settings](https://www.figma.com/developers/api#access-tokens).
- **`WEBFLOW_API_TOKEN`** — Site or workspace API token. Generate at [Webflow Integrations](https://webflow.com/dashboard/integrations/api-tokens).

### Asset Pipeline

```
Figma → export-assets.js → assets/ (local) → upload-assets.js → Webflow Asset Library
                                ↓
                        asset-manifest.json (tracks each asset through the pipeline)
```

The `asset-manifest.json` tracks every asset from Figma source to Webflow destination, enabling idempotent re-runs and hash-based deduplication.

## Known Issues & Learnings

Documented from test runs — these are critical to review before starting a new project.

### Figma MCP Rate Limits

The Figma MCP server has tool call limits per seat/plan. A single `/build-component` run can exhaust the free tier with `get_design_context` + `get_metadata` + `get_screenshot` + `get_variable_defs` calls. **Fallback:** Use the Figma REST API scripts (`extract-styles.js`, `FigmaClient.exportImages()`) which use your personal access token and have separate rate limits.

### Webflow 4MB Asset Limit

Webflow API rejects asset uploads exceeding 4MB. Figma exports are uncompressed PNG and frequently exceed this (5–11MB for photos). The upload script auto-compresses oversized images using `sips` (macOS) — converts PNG to JPEG at 80% quality, resizes to max 2400px width if still too large.

### Designer API / Data API Asset Gap

Assets uploaded via the **Data API** (`upload-assets.js`) are not immediately visible to the **Designer API** (`set_image_asset`). Workaround: set the `src` attribute directly on Image elements using the CDN URL. This means you may need to publish first, then set images via attribute.

### Section Structure is Mandatory

Every section MUST follow the Client-First wrapper pattern. Sub-agents frequently skip this — always verify after building:

```
DivBlock (tag: section) .section_[layout-name]
  └─ DivBlock .padding-global .padding-section-large
       └─ DivBlock .container-large
            └─ DivBlock (tag: article) .[component]_component
                 ├─ DivBlock (tag: header) .[component]_header
                 │    ├─ Heading .heading-style-h2 .[component]_heading
                 │    └─ Paragraph .text-size-medium .[component]_description
                 ├─ DivBlock (tag: figure) .[component]_image-wrapper
                 │    └─ Image .u-image
                 └─ DivBlock (tag: footer) .[component]_cta
                      └─ TextLink .button .is-link
```

**Rules:**
- All elements use `type: "DivBlock"` — set semantic tags (section, article, header, footer, figure) later in Designer
- Section class names describe **layout pattern** not content (`section_split-image` not `section_about`)
- Custom layout styles (flex, gap, grid) only on `_component` and below — never on section/padding/container
- Use `<header>` for heading areas, `<footer>` for CTA areas, `<figure>` for images, `<article>` for component wrappers

### Client-First Page Structure

Every page must have this wrapper hierarchy before any components:

```
Body
  └─ page-wrapper
       ├─ Global Styles (component instance)
       └─ main-wrapper
            └─ [all sections go here]
```

### Sub-Agent Convention Drift

Sub-agents delegated by `/build-component` consistently skip documented conventions (wrappers, semantic HTML, descriptive class names, DivBlock-only). A post-build review step is needed to catch these structural issues before publishing.

### Class Naming for Reuse

Section names should describe layout patterns, not content:
- `section_split-image` — two columns, image + text
- `section_full-bleed` — full-viewport hero with overlay
- `section_mosaic-grid` — scattered image collage
- `section_scroll-strip` — horizontal scrolling row
- `section_card-grid` — cards in a grid layout

This enables reuse across pages and projects. A system for comparing component maps against existing styles is needed.

### Use Existing Heading Styles, Not Custom Ones

Never create custom heading styles like `hero_heading` or `about_heading`. Use the existing Relume `heading-style-h1` through `heading-style-h6` classes. If a section needs overrides (different color, text-transform), add a combo class: `.heading-style-h2` + `.[section]_heading`. The combo class should ONLY contain overrides, not repeat base typography values.

### Default Vertical Alignment Should Be Center

Sections should use `align-items: center` by default, not `justify-content: flex-end`. The flex-end alignment was incorrectly applied because Figma's absolute positioning within fixed-height frames was translated literally. In responsive Webflow, this should almost always be center alignment. Only use flex-end when the design explicitly requires bottom-aligned content (e.g., hero with content at the bottom over a full-bleed image).

### Images Need Aspect Ratios, Not Stretching

Never let images stretch without constraints. Use `aspect-ratio` or percentage-based heights instead of fixed rem heights. When Figma shows a fixed-dimension image, convert to an aspect ratio (e.g., 29.5rem x 21.75rem → aspect-ratio: 29.5/21.75 ≈ 1.36/1). This prevents images from distorting at different viewports.

### Designer API Cannot See Data API Assets

Assets uploaded via the Data API (`upload-assets.js`) are not visible to the Designer API's `set_image_asset` action. The Designer's `asset_tool > get_all_assets_and_folders` only returns assets that existed before the Data API uploads. Workaround: set the `src` attribute directly on Image elements using the CDN URL via `element_tool > add_or_update_attribute`.

### Sub-Agents Need the Full Plan Context

The build-component skill delegates to sub-agents that don't read the reference docs deeply. The original implementation plan (docs/plans/) had detailed semantic HTML patterns and structural requirements that were ignored. Sub-agent prompts must include the EXACT structural pattern inline — not just references to docs they may not read. Consider embedding the 4-layer section pattern directly in sub-agent task descriptions.

### Copy Verification Is Essential

Some sections had wrong copy ("THIS IS SOME TEXT INSIDE OF A DIV BLOCK" placeholder, wrong restaurant names, fabricated body text). After building, always do a systematic copy check comparing every text node against the Figma reference screenshot. The component map (docs/component-maps/) captures the correct text — use it as the source of truth.

### Figma Absolute Positioning ≠ Responsive Layout

Figma designs use absolute positioning within fixed-size frames. Translating these literally to Webflow produces layouts that break at different viewports. Always convert Figma's fixed positions to flex/grid layouts with relative sizing (percentages, fr units, auto).

### Text Wrapping and Line Breaks Matter

How text wraps (which words appear on which line) is an important design detail. If Figma shows a heading on one line, Webflow must match. Check the `width` property on Figma text nodes — this is the `max-width` constraint that controls wrapping. Also check parent container widths — a narrow parent forces child text to wrap even if the text element is wide enough. Font differences between Figma and web can cause different character widths, so verify fonts are loading.

### Design Decision Loop (Compare & Fix Process)

When iterating on sections to match Figma, follow this 4-step hierarchy per section:

1. **Figma CSS** — Extract exact CSS values from the component map or `extract-styles.js`. Apply these first. Trust the numbers.
2. **Visual check** — Snapshot the section via `element_snapshot_tool` and compare against Figma reference. Check text wrapping, alignment, spacing, image proportions, colors, content accuracy.
3. **Check for Figma CSS misses** — If visual doesn't match despite correct CSS, go back and extract missed properties (opacity, transforms, max-width constraints, overflow, border-radius, box-shadow).
4. **Cross-reference Figma visually** — If CSS is correct but layout is wrong, Figma likely uses absolute positioning or manual adjustments. Convert to responsive alternatives: center instead of absolute-bottom, percentage instead of fixed-rem, aspect-ratio instead of fixed-height.

This loop runs per section during the build-component iteration phase. Use `element_snapshot_tool` for quick visual checks without publishing. Only publish + Playwright for the final full-page comparison.

### Section Classification: Structured vs Editorial

Not all sections are equally automatable. Classify each section before building:

- **Structured components (~90% automated):** Two-column splits, card grids, hero sections, CTA banners, footers, forms. These follow predictable flex/grid patterns — the feedback loop handles the remaining ~10%.
- **Editorial compositions (~70% automated, manual finish):** Scattered image collages, overlapping elements, rotated text, individually positioned items. The automation handles element creation, assets, fonts, colors, and basic spatial relationships. The developer finishes positioning in Webflow Designer (~5-10 minutes).

**How to classify:** If Figma elements are inside auto-layout frames → structured. If elements float independently with absolute positions → editorial.

### Layout Tools Hierarchy

Professional designers combine multiple CSS tools to achieve precise layouts. Use them in priority order:

1. **Layout systems first** — `flex`, `grid`, `align-self`, `gap`, `nth-child` CSS
2. **Spacing adjustments** — `margin`, `padding` to fine-tune when layout alone isn't enough
3. **Positioning last** — `position: relative` with offsets only when flex+margins can't solve it

These tools should be COMBINED — e.g., left column `align-self: flex-end` + right image `align-self: flex-start` achieves a staggered layout without hacks. Don't blindly override Figma alignment values — if Figma says `flex-end`, check the visual first. Content may genuinely need to be bottom-aligned with deliberate empty space above.

### Complex Layouts

Mosaic/collage layouts may need `nth-child` CSS via custom code injection since basic Webflow flex/grid can't handle irregular positioning. Use `/custom-code-management` for these cases.

## MCP Limitations

The MCPs cannot:
- Export individual assets from Figma (only full-node screenshots)
- Upload images to the Webflow asset library
- Style rich text children (nested All H2s, All Paragraphs, etc.)
- Create real form elements (FormInput, FormTextarea, FormSelect)
- Edit content inside RichText blocks
- Set page SEO metadata or Open Graph tags

The API utilities address the first two. The Style Guide page must still come from a template (Relume) for rich text and form element styling.

## License

MIT
