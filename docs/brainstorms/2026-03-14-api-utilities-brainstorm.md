# API Utilities — Figma & Webflow REST API Integration

**Date:** 2026-03-14
**Status:** Brainstorm

## What We're Building

A suite of API utilities that bridge the gaps between what the Figma and Webflow MCP servers can do and what the underlying REST APIs support. These utilities unlock capabilities the MCPs don't expose — primarily asset export/upload, precise style extraction, bulk metadata management, and SEO automation.

The utilities live as **Node.js scripts** in `scripts/` with thin **Claude Code skills** that orchestrate them.

## Why This Approach

The Figma MCP is optimized for design-to-code translation (screenshots, code hints, variables). The Webflow MCP is optimized for visual building (elements, styles, classes). Neither exposes the full REST API surface. Key gaps:

- **Figma MCP can't:** export assets as SVG/PNG files, extract original-quality image fills, read exact CSS-equivalent node properties, list components/variants
- **Webflow MCP can't:** upload images to the asset library, update asset alt text/display names, set page SEO metadata or Open Graph tags

These gaps create manual bottlenecks in the pipeline — especially image handling, which currently requires manual download from Figma → manual upload to Webflow → manual recording of asset URLs.

## Capabilities

### 1. Figma Asset Export (HIGH PRIORITY)

**What:** Export all images, icons, and logos from a Figma component/frame as local files.

**How it works:**
1. `GET /v1/files/:file_key/nodes?ids=<node_id>` — walk the node tree, collect `imageRef` values from IMAGE fills, identify SVG-exportable nodes (icons, logos)
2. `GET /v1/files/:file_key/images` — get download URLs for all image fills (original quality photos/backgrounds)
3. `GET /v1/images/:file_key?ids=<icon_ids>&format=svg&svg_outline_text=true` — export icons/logos as clean SVGs
4. `GET /v1/images/:file_key?ids=<raster_ids>&format=png&scale=2` — export decorative elements as retina PNGs
5. Download all files to `assets/` directory organized by type

**Output structure:**
```
assets/
  images/       # Photos, backgrounds (from image fills)
  icons/        # SVG icons
  logos/        # SVG/PNG logos and brand marks
  manifest.json # Full manifest with metadata
```

**Manifest format (per asset):**
```json
{
  "filename": "hero-background.webp",
  "originalName": "hero-bg-photo",
  "figmaNodeId": "123:456",
  "figmaImageRef": "abc123",
  "type": "image",
  "format": "webp",
  "dimensions": { "width": 1920, "height": 1080 },
  "altText": "AI-generated description of the image",
  "webflowAssetId": null,
  "webflowUrl": null
}
```

**Naming convention:** kebab-case, descriptive names derived from Figma layer names. Claude vision can suggest better names for ambiguously named layers.

**Auth:** `FIGMA_API_TOKEN` in `.env` (personal access token, 90-day max expiry as of April 2025).

**Rate limits:** Image export is Tier 1 (~10-20 req/min). Batch multiple node IDs per call to minimize requests. Image fills endpoint is Tier 2 (~25-100 req/min).

### 2. Webflow Asset Upload (HIGH PRIORITY)

**What:** Upload local assets to the Webflow asset library and update the manifest with Webflow URLs.

**How it works:**
1. Read `assets/manifest.json` to get list of files to upload
2. For each file: compute MD5 hash, call `POST /v2/sites/:siteId/assets` to get presigned S3 URL
3. Upload binary to S3 using returned `uploadUrl` + `uploadDetails`
4. Update manifest with `webflowAssetId` and `webflowUrl` (the `hostedUrl` from the response)
5. Optionally organize into Webflow asset folders via `POST /v2/sites/:siteId/asset-folders`

**Constraints:** Images max 4MB, documents max 10MB. Supported formats: PNG, JPEG, GIF, SVG, WebP, AVIF.

**Auth:** Webflow API token (already available via the MCP's auth, or a separate `WEBFLOW_API_TOKEN` in `.env`).

**Deduplication:** The fileHash mechanism means re-uploading the same file is a no-op — safe for repeated runs.

### 3. Bulk Asset Metadata (MEDIUM PRIORITY)

**What:** Generate and apply alt text, display names, and SEO-friendly filenames for all Webflow assets.

**How it works:**
1. `GET /v2/sites/:siteId/assets` — list all assets
2. For assets missing alt text: use Claude vision to analyze the image and generate a descriptive alt text
3. For assets with non-descriptive names: suggest better display names
4. `PATCH /v2/sites/:siteId/assets/:assetId` — apply `altText` and `displayName` updates
5. Generate a report of changes made

**Integration:** Can also read from `assets/manifest.json` if alt text was pre-generated during Figma export.

### 4. Precise Figma Style Extraction (MEDIUM PRIORITY)

**What:** Extract exact CSS-equivalent values from Figma nodes instead of relying on the MCP's Tailwind approximation.

**How it works:**
1. `GET /v1/files/:file_key/nodes?ids=<node_ids>` — get full node data
2. Parse raw properties: `fontSize`, `lineHeightPx`, `fontWeight`, `letterSpacing`, fills (hex colors, gradients), effects (shadows, blurs), auto-layout (`layoutMode`, `itemSpacing`, `padding*`)
3. Output a structured JSON with exact values mapped to CSS properties
4. Compare against existing Webflow classes to identify which utility classes match and where custom styles are needed

**Use case:** When the MCP's `get_design_context` returns Tailwind approximations that don't match exactly (e.g., `text-lg` when the actual size is 19px), this gives the ground truth values.

### 5. SEO Metadata Automation (MEDIUM PRIORITY)

**What:** Set page titles, meta descriptions, and Open Graph tags programmatically after builds.

**How it works:**
1. `GET /v2/sites/:siteId/pages` — list all pages
2. For each page: analyze the page content (heading text, body copy) to generate SEO title and meta description
3. `PUT /beta/pages/:pageId` — set `seo.title`, `seo.description`, `openGraph.title`, `openGraph.description`
4. Publish site to activate changes

**Note:** OG image cannot be set via API — must be done manually in Designer.

## Architecture

```
scripts/
  figma/
    export-assets.js      # Figma asset export (capability 1)
    extract-styles.js     # Precise style extraction (capability 4)
  webflow/
    upload-assets.js      # Webflow asset upload (capability 2)
    update-metadata.js    # Bulk alt text + display names (capability 3)
    update-seo.js         # SEO metadata (capability 5)
  lib/
    figma-client.js       # Figma REST API client (auth, rate limiting)
    webflow-client.js     # Webflow REST API client (auth, S3 upload)
  manifest.json           # Script-to-component mapping (for skills)

.claude/skills/
  export-assets/SKILL.md  # Skill wrapper for Figma export + Webflow upload
  update-seo/SKILL.md     # Skill wrapper for SEO metadata
  asset-metadata/SKILL.md # Skill wrapper for bulk alt text

assets/                   # Local asset storage (git-ignored)
  images/
  icons/
  logos/
  manifest.json
```

## Key Decisions

1. **Scripts + Skills pattern** — Core logic in testable Node.js scripts, thin skill wrappers for discoverability. Same pattern as the custom code delivery system.
2. **Organized by type** — Assets grouped as `images/`, `icons/`, `logos/` rather than by component or flat.
3. **Manifest-driven** — A JSON manifest tracks every asset through the pipeline (Figma → local → Webflow), enabling idempotent re-runs.
4. **Env-based auth** — `FIGMA_API_TOKEN` and `WEBFLOW_API_TOKEN` in `.env`, same pattern as existing `WEBFLOW_SITE_URL`.
5. **Standalone first, pipeline later** — Build as independent skills first (`/export-assets`, `/update-seo`, `/asset-metadata`), then wire into `build-component` pipeline.
6. **Full manifest with AI metadata** — Manifest includes Claude vision-generated alt text, dimensions, Figma node IDs, and Webflow asset IDs.

## Resolved Questions

1. **Image format conversion** — Keep original format (PNG/JPG/SVG). Webflow has built-in image compression and optimization on their platform, so no client-side conversion needed.
2. **Webflow API token source** — Use a separate `WEBFLOW_API_TOKEN` in `.env`. Independent of the MCP's Designer companion app auth. Can be a site-level or workspace-level token.
3. **Rate limit handling** — Batch IDs + exponential backoff. The image export endpoint accepts multiple node IDs per call (minimizes requests), and exponential backoff on 429 responses adds resilience with minimal code.
4. **Asset deduplication across builds** — Skip by MD5 fileHash. Compare hash before uploading — if an identical asset exists in Webflow, skip the upload. Enables fast idempotent re-runs.

## Open Questions

_(None remaining)_
