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
