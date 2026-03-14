---
title: "feat: API Utilities — Figma & Webflow REST API Integration"
type: feat
status: active
date: 2026-03-14
brainstorm: docs/brainstorms/2026-03-14-api-utilities-brainstorm.md
---

# feat: API Utilities — Figma & Webflow REST API Integration

## Overview

Build a suite of Node.js scripts and Claude Code skills that bridge the gaps between what the Figma/Webflow MCP servers can do and what the underlying REST APIs support. Five capabilities: Figma asset export, Webflow asset upload, bulk asset metadata, precise Figma style extraction, and SEO metadata automation.

This eliminates the biggest manual bottleneck in the pipeline — image handling — and adds new automation capabilities the MCPs don't expose.

## Problem Statement / Motivation

The build-component pipeline currently requires manual image handling:
1. Manually download images from Figma
2. Manually upload to Webflow asset library
3. Manually record asset URLs for use in element building

CLAUDE.md documents this limitation: "Images must be pre-uploaded to Webflow asset library (MCP can't upload)." The Figma MCP has no asset export tool. The Webflow MCP has no upload tool.

Additionally, SEO metadata (page titles, descriptions, OG tags) and asset alt text must be set manually — the MCPs don't expose these Data API capabilities.

## Proposed Solution

### Architecture

```
scripts/
  api/                        # API utility scripts (separate from browser scripts)
    figma/
      export-assets.js        # Capability 1: Figma asset export
      extract-styles.js       # Capability 4: Precise style extraction
    webflow/
      upload-assets.js        # Capability 2: Webflow asset upload
      update-metadata.js      # Capability 3: Bulk alt text + display names
      update-seo.js           # Capability 5: SEO metadata
    lib/
      figma-client.js         # Figma REST API client (auth, rate limiting, backoff)
      webflow-client.js       # Webflow REST API client (auth, S3 upload, backoff)
      manifest.js             # Manifest read/write/merge utilities

assets/                       # Local asset storage (git-ignored)
  images/                     # Photos, backgrounds (from image fills)
  icons/                      # SVG icons
  logos/                      # SVG/PNG logos and brand marks
  asset-manifest.json         # Asset pipeline manifest (NOT scripts/manifest.json)

.claude/skills/
  export-assets/SKILL.md      # Skill: Figma export + Webflow upload combo
  update-seo/SKILL.md         # Skill: SEO metadata automation
  asset-metadata/SKILL.md     # Skill: Bulk alt text generation
```

**Key distinction:** API utility scripts live in `scripts/api/` to avoid confusion with the browser-side scripts in `scripts/global/` and `scripts/components/` (custom code delivery). The asset manifest is named `asset-manifest.json` (not `manifest.json`) to avoid collision with `scripts/manifest.json`.

### Asset-to-Element Mapping (Critical Integration)

Each manifest entry tracks the Figma node ID where the image was found. During build-component Phase 4, the skill can match assets to elements by:

1. The `figmaNodeId` in the manifest corresponds to a node in the Figma design context
2. The skill reads the design context to know which element contains each image
3. When building that element with `element_tool`, it uses the `webflowUrl` from the manifest entry

The manifest entry includes a `context` field with the parent component name and the layer path, making manual matching straightforward when automatic mapping isn't possible.

```json
{
  "figmaNodeId": "123:456",
  "context": {
    "component": "two-img-imba",
    "layerPath": "Frame > Image Container > hero-photo",
    "parentNodeId": "123:400"
  }
}
```

## Implementation Phases

### Phase 1: Foundation — Shared Libraries and Configuration

Set up the infrastructure that all capabilities depend on.

#### 1.1 Environment Configuration

- [x] Add `FIGMA_API_TOKEN` and `WEBFLOW_API_TOKEN` to `.env.example` with comments:
  ```
  # Figma Personal Access Token (90-day max expiry)
  # Required scopes: file_content:read
  # Generate at: https://www.figma.com/developers/api#access-tokens
  FIGMA_API_TOKEN=

  # Webflow API Token (site-level or workspace-level)
  # Generate at: https://webflow.com/dashboard/integrations/api-tokens
  WEBFLOW_API_TOKEN=

  # Webflow Site ID (found in Site Settings > General)
  WEBFLOW_SITE_ID=
  ```
- [x] Add `assets/` to `.gitignore`
- [x] Add `scripts/api/` directory structure

#### 1.2 Figma API Client — `scripts/api/lib/figma-client.js`

Shared HTTP client for all Figma REST API calls.

```javascript
// scripts/api/lib/figma-client.js
//
// Responsibilities:
// - Read FIGMA_API_TOKEN from process.env
// - Validate token exists on init (throw clear error if missing)
// - Set X-Figma-Token header on all requests
// - Implement exponential backoff on 429 responses (start 1s, max 60s, 5 retries)
// - Batch node IDs where API supports it (comma-separated ids param)
// - Log rate limit headers (X-RateLimit-Remaining) for debugging
//
// Methods:
// - getFileNodes(fileKey, nodeIds, opts) → node tree JSON
// - getImageFills(fileKey) → { imageRef: downloadUrl } map
// - exportImages(fileKey, nodeIds, format, scale, opts) → { nodeId: imageUrl } map
// - getFileComponents(fileKey) → component list
// - getFileStyles(fileKey) → style list
```

- [x] Create `figma-client.js` with native `fetch` (Node 18+)
- [x] Implement exponential backoff: 1s → 2s → 4s → 8s → 16s, max 5 retries on 429
- [x] Token validation on construction (fail fast with clear message)
- [x] Batch ID support in `exportImages` (join IDs with commas)
- [x] Handle 401 with clear "Token expired or invalid" error message

#### 1.3 Webflow API Client — `scripts/api/lib/webflow-client.js`

Shared HTTP client for all Webflow Data API v2 calls.

```javascript
// scripts/api/lib/webflow-client.js
//
// Responsibilities:
// - Read WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID from process.env
// - Set Authorization: Bearer header
// - Implement exponential backoff on 429 responses
// - Handle the 2-step S3 presigned upload flow
// - Log rate limit info for debugging
//
// Methods:
// - listAssets() → asset array
// - getAsset(assetId) → asset object
// - uploadAsset(filePath, displayName) → { assetId, hostedUrl }
//     internally: POST to get presigned URL → POST binary to S3
// - updateAsset(assetId, { altText, displayName }) → updated asset
// - createAssetFolder(name) → folder object
// - listPages() → page array
// - updatePageSeo(pageId, { seoTitle, seoDescription, ogTitle, ogDescription }) → updated page
// - publishSite() → 202 response
```

- [x] Create `webflow-client.js` with native `fetch`
- [x] Implement S3 presigned upload flow:
  1. POST `/v2/sites/:siteId/assets` with `{ fileName, fileHash }` (MD5 as hex)
  2. POST binary to returned `uploadUrl` with `uploadDetails` fields as form data
  3. Return the `hostedUrl` from the response
- [x] MD5 hash computation using Node.js `crypto` module (built-in, no dependency)
- [x] Exponential backoff matching figma-client pattern
- [x] Handle 401 with "Token expired or invalid" error

#### 1.4 Manifest Utilities — `scripts/api/lib/manifest.js`

```javascript
// scripts/api/lib/manifest.js
//
// Manages assets/asset-manifest.json with upsert semantics.
// Uses figmaNodeId as the unique key for merging.
//
// Methods:
// - read() → manifest object (or empty default)
// - write(manifest) → writes to disk
// - upsert(entry) → merge by figmaNodeId, preserving existing webflow fields
// - findByNodeId(nodeId) → entry or null
// - findByHash(md5Hash) → entry or null
// - getUnuploaded() → entries where webflowAssetId is null
// - reconcile() → remove entries where local file is missing from disk
```

- [x] Create `manifest.js` with read/write/upsert/reconcile operations
- [x] Upsert by `figmaNodeId` — re-exports update existing entries, don't wipe manifest
- [x] `reconcile()` marks entries as `status: "missing_locally"` if file doesn't exist on disk
- [x] Atomic writes (write to temp file, then rename) to prevent corruption on interruption

#### 1.5 Package Dependencies

- [x] Add to `package.json` (no new runtime dependencies needed — native `fetch` and `crypto`):
  ```json
  {
    "scripts": {
      "export-assets": "node scripts/api/figma/export-assets.js",
      "upload-assets": "node scripts/api/webflow/upload-assets.js",
      "update-metadata": "node scripts/api/webflow/update-metadata.js",
      "extract-styles": "node scripts/api/figma/extract-styles.js",
      "update-seo": "node scripts/api/webflow/update-seo.js"
    }
  }
  ```

### Phase 2: Figma Asset Export (HIGH PRIORITY)

#### 2.1 Core Export Script — `scripts/api/figma/export-assets.js`

```javascript
// scripts/api/figma/export-assets.js
//
// Usage: node scripts/api/figma/export-assets.js <fileKey> <nodeId>
//
// Steps:
// 1. Parse fileKey and nodeId from args (or from env: FIGMA_FILE_KEY, FIGMA_NODE_ID)
// 2. Call figmaClient.getFileNodes(fileKey, [nodeId], { depth: 10 })
// 3. Walk the node tree:
//    a. Collect nodes with fills[].type === "IMAGE" → extract imageRef
//    b. Classify exportable nodes:
//       - Nodes named with "icon" or in an "icons" frame → SVG export
//       - Nodes named with "logo" or in a "logos" frame → SVG export (+ PNG at 2x)
//       - All other IMAGE fills → download original from image fills endpoint
//    c. Skip hidden nodes (visible === false)
//    d. Skip nodes inside inactive variant states
// 4. Call figmaClient.getImageFills(fileKey) → download URL map
// 5. For SVG-exportable nodes: call figmaClient.exportImages(fileKey, ids, 'svg', { svgOutlineText: true })
// 6. For raster-exportable nodes: call figmaClient.exportImages(fileKey, ids, 'png', { scale: 2 })
// 7. Download all files to assets/{type}/ directory
// 8. Generate kebab-case filenames from layer names (append counter on collision: hero-image-2.png)
// 9. Upsert each entry into asset-manifest.json via manifest.upsert()
```

- [x] Create `export-assets.js`
- [x] Node tree walker with classification logic (image fill vs SVG-exportable)
- [x] Skip hidden nodes (`visible === false`)
- [x] Filename collision handling: append `-2`, `-3`, etc.
- [x] Download files using native `fetch` with stream piping to disk
- [x] Create `assets/images/`, `assets/icons/`, `assets/logos/` directories if needed
- [x] Upsert manifest entries with full metadata:
  ```json
  {
    "filename": "hero-background.png",
    "originalFigmaName": "hero-bg-photo",
    "figmaNodeId": "123:456",
    "figmaImageRef": "abc123def",
    "type": "image",
    "format": "png",
    "dimensions": { "width": 1920, "height": 1080 },
    "localPath": "assets/images/hero-background.png",
    "context": {
      "component": "two-img-imba",
      "layerPath": "Frame > Image Container > hero-bg-photo",
      "parentNodeId": "123:400"
    },
    "altText": null,
    "webflowAssetId": null,
    "webflowUrl": null,
    "md5Hash": null,
    "status": "exported"
  }
  ```

#### 2.2 Export Skill Wrapper — `.claude/skills/export-assets/SKILL.md`

- [x] Create skill that orchestrates the full export → upload flow
- [x] Skill accepts: Figma URL (parses fileKey and nodeId) or explicit fileKey + nodeId
- [x] Runs `export-assets.js` then optionally `upload-assets.js`
- [x] Displays manifest summary after completion
- [x] Allowed tools: `Bash`, `Read`, `Write`, `Glob`

### Phase 3: Webflow Asset Upload (HIGH PRIORITY)

#### 3.1 Upload Script — `scripts/api/webflow/upload-assets.js`

```javascript
// scripts/api/webflow/upload-assets.js
//
// Usage: node scripts/api/webflow/upload-assets.js [--force]
//
// Steps:
// 1. Read asset-manifest.json via manifest.read()
// 2. Get list of entries to upload: manifest.getUnuploaded()
// 3. For each entry:
//    a. Check file exists on disk (skip with warning if missing)
//    b. Compute MD5 hash, store in manifest entry
//    c. Check if hash already exists in Webflow assets (deduplication):
//       - List Webflow assets once, build a hash → assetId map
//       - If match found: set webflowAssetId and webflowUrl from existing, skip upload
//    d. Check file size ≤ 4MB:
//       - If > 4MB: re-export from Figma at scale=1 (instead of scale=2)
//       - If still > 4MB: skip with status "oversized", log warning
//    e. Upload via webflowClient.uploadAsset(localPath, displayName)
//    f. Update manifest entry: webflowAssetId, webflowUrl, status = "uploaded"
// 4. Write updated manifest
// 5. Print summary: uploaded N, skipped N (duplicate), skipped N (oversized), failed N
```

- [x] Create `upload-assets.js`
- [x] Hash-based deduplication: list existing Webflow assets once, build lookup map
- [x] 4MB size check with fallback to scale=1 re-export
- [x] Sequential uploads with rate limit backoff (Webflow ~60 req/min on General plan)
- [x] Manifest update after each successful upload (not all at end) for crash resilience
- [x] Summary output with counts

### Phase 4: Bulk Asset Metadata (MEDIUM PRIORITY)

#### 4.1 Metadata Script — `scripts/api/webflow/update-metadata.js`

```javascript
// scripts/api/webflow/update-metadata.js
//
// Usage: node scripts/api/webflow/update-metadata.js [--force] [--dry-run]
//
// Steps:
// 1. List all Webflow assets via webflowClient.listAssets()
// 2. Filter to assets missing altText (unless --force)
// 3. For each asset needing alt text:
//    a. Download a preview of the image (or use asset URL)
//    b. Output the asset URL and prompt for alt text generation
//       (Claude vision runs in the skill wrapper, not in the script)
//    c. If --dry-run: log proposed changes, don't apply
// 4. Apply via webflowClient.updateAsset(assetId, { altText, displayName })
// 5. Generate report: updated N assets, skipped N (already had alt text)
```

- [x] Create `update-metadata.js`
- [x] `--dry-run` flag for preview without changes
- [x] `--force` flag to overwrite existing alt text
- [x] Skip assets that already have alt text by default (idempotent)
- [x] Rate limit handling for bulk PATCH operations

#### 4.2 Metadata Skill Wrapper — `.claude/skills/asset-metadata/SKILL.md`

- [x] Create skill that lists assets needing alt text
- [x] Uses Claude vision to analyze each image and generate alt text
- [x] Presents preview of proposed changes before applying (confirm-then-apply pattern)
- [x] Falls back to manifest alt text if available (pre-generated during export)
- [x] Allowed tools: `Bash`, `Read`, `Write`, `mcp__webflow__asset_tool`, `mcp__webflow__get_image_preview`

### Phase 5: Precise Figma Style Extraction (MEDIUM PRIORITY)

#### 5.1 Style Extraction Script — `scripts/api/figma/extract-styles.js`

```javascript
// scripts/api/figma/extract-styles.js
//
// Usage: node scripts/api/figma/extract-styles.js <fileKey> <nodeId>
//
// Steps:
// 1. Call figmaClient.getFileNodes(fileKey, [nodeId], { depth: 10 })
// 2. For each node, extract CSS-equivalent properties:
//    - Typography: fontSize (px→rem), lineHeight (px→unitless ratio),
//      fontWeight, fontFamily, letterSpacing, textTransform, textAlign
//    - Colors: fill colors as hex/rgba, gradient definitions
//    - Spacing: auto-layout padding, itemSpacing, gap
//    - Dimensions: width, height, minWidth, maxWidth
//    - Effects: boxShadow (from dropShadow), filter: blur (from layerBlur)
//    - Border: borderRadius, stroke weight/color
//    - Layout: display (flex from auto-layout), flexDirection, alignItems, justifyContent
// 3. Output structured JSON to stdout (skill captures and uses)
// 4. Optionally compare against known utility classes (heading-style-h1, text-size-large, etc.)
//    and flag matches vs. custom values needed
```

- [x] Create `extract-styles.js`
- [x] px-to-rem conversion (base 16px) for all sizing values
- [x] Map Figma auto-layout properties to CSS flexbox equivalents
- [x] Map Figma effects to CSS shadow/blur syntax
- [x] Output JSON keyed by node ID with CSS properties per node
- [ ] Utility class matching against CLAUDE.md conventions

### Phase 6: SEO Metadata Automation (MEDIUM PRIORITY)

#### 6.1 SEO Script — `scripts/api/webflow/update-seo.js`

```javascript
// scripts/api/webflow/update-seo.js
//
// Usage: node scripts/api/webflow/update-seo.js [--dry-run] [--page <slug>]
//
// Steps:
// 1. List all Webflow pages via webflowClient.listPages()
// 2. For each page (or specific --page):
//    a. Get current SEO metadata
//    b. Output page URL, current SEO fields, and page slug
//       (SEO content generation happens in the skill wrapper via Claude)
//    c. If --dry-run: log current state, don't modify
// 3. Apply via webflowClient.updatePageSeo(pageId, seoData)
// 4. Report changes made
```

- [x] Create `update-seo.js`
- [x] `--dry-run` flag for preview
- [x] `--page <slug>` flag to target a single page
- [x] Skip pages that already have non-empty SEO fields (unless `--force`)
- [x] Uses `PUT /beta/pages/:pageId` — document beta API stability risk in script comments

#### 6.2 SEO Skill Wrapper — `.claude/skills/update-seo/SKILL.md`

- [x] Create skill that orchestrates SEO metadata generation
- [x] Content source: use `element_snapshot_tool` (MCP) to get page content, or fall back to Playwright scrape of published page
- [x] Claude generates SEO title (≤60 chars), meta description (≤160 chars), OG title, OG description
- [x] **Confirm-before-apply pattern**: show proposed metadata side-by-side with current, require user confirmation
- [x] Warn if overwriting non-empty existing metadata
- [x] Allowed tools: `Bash`, `Read`, `Write`, `mcp__webflow__data_pages_tool`, `mcp__webflow__element_snapshot_tool`

### Phase 7: Pipeline Integration

Wire the new capabilities into the existing build-component pipeline.

- [ ] Update `.claude/skills/build-component/SKILL.md`:
  - Add new Phase 2.5 "Asset Export & Upload" between Figma Read and Webflow Build
  - Reference `/export-assets` skill for automated image handling
  - In Phase 4 (Build), look up `webflowUrl` from `asset-manifest.json` when setting image sources
  - In Phase 6 (post-build), optionally run `/update-seo` for the built page
- [ ] Add `scripts/api/**` to build-component's allowed `Read` paths
- [ ] Add `assets/**` to build-component's allowed `Read` paths
- [ ] Update CLAUDE.md: remove "Images must be pre-uploaded" limitation, document new asset workflow

### Phase 8: Documentation

- [x] Update `.env.example` with all new variables (Phase 1.1)
- [ ] Update CLAUDE.md with asset pipeline section
- [ ] Add `docs/reference/api-utilities.md` documenting:
  - Required API tokens and scopes
  - Script usage (CLI args)
  - Manifest schema
  - Rate limit behavior
  - Troubleshooting (expired tokens, 4MB limit, rate limiting)

## Technical Considerations

### No new dependencies

All scripts use Node.js built-ins:
- `fetch` (native since Node 18) for HTTP requests
- `crypto` for MD5 hashing
- `fs/promises` for file I/O
- `path` for file path handling

This keeps the project lean, matching the existing minimal dependency philosophy.

### Rate limiting strategy

Both API clients implement the same pattern:
1. **Batch where possible** — Figma image export accepts multiple IDs per call
2. **Exponential backoff on 429** — 1s → 2s → 4s → 8s → 16s, max 5 retries
3. **Sequential processing** — no concurrent API calls (simpler, avoids rate limit exhaustion)
4. **Log remaining quota** — read `X-RateLimit-Remaining` headers for debugging

### Figma token expiration

PATs expire every 90 days max (April 2025 change). The figma-client handles this:
- On 401: clear error message "Figma token expired or invalid. Generate a new one at https://www.figma.com/developers/api#access-tokens"
- Document the 90-day rotation requirement in `.env.example` and reference docs

### S3 presigned upload flow

The Webflow asset upload is a 2-step process:
1. `POST /v2/sites/:siteId/assets` with `{ fileName, fileHash }` → returns `uploadUrl` + `uploadDetails`
2. `POST` to the S3 `uploadUrl` with `uploadDetails` fields as multipart form data, plus the file binary

The `uploadDetails` contains: `acl`, `bucket`, `X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-Date`, `X-Amz-Signature`, `Policy`, `key`, `Content-Type`, `Cache-Control`, `success_action_status`.

### 4MB oversized image handling

When an image exceeds Webflow's 4MB limit:
1. Re-export from Figma at `scale=1` (instead of default `scale=2`)
2. If still > 4MB: mark as `status: "oversized"` in manifest, log clear warning
3. The user must manually resize or compress the image

### Manifest merge semantics

The manifest uses `figmaNodeId` as the unique key:
- **Re-export same node**: updates existing entry, preserves Webflow fields if file unchanged
- **Export different node**: adds new entries, does not remove existing ones
- **`reconcile()`**: marks entries as `"missing_locally"` if the local file was deleted
- **Never auto-deletes entries** — the user must manually clean the manifest

## Acceptance Criteria

### Phase 1 (Foundation)
- [x] `.env.example` documents `FIGMA_API_TOKEN`, `WEBFLOW_API_TOKEN`, `WEBFLOW_SITE_ID`
- [x] `assets/` is in `.gitignore`
- [x] `figma-client.js` can authenticate and fetch a Figma node tree
- [x] `webflow-client.js` can authenticate and list Webflow assets
- [x] `manifest.js` can read/write/upsert `asset-manifest.json`

### Phase 2 (Figma Export)
- [x] Running `node scripts/api/figma/export-assets.js <fileKey> <nodeId>` downloads images to `assets/`
- [x] SVGs are exported with `svg_outline_text=true`
- [x] Raster images are exported at 2x scale
- [x] `asset-manifest.json` is generated with all metadata fields
- [x] Hidden nodes are skipped
- [x] Duplicate filenames get counter suffixes

### Phase 3 (Webflow Upload)
- [x] Running `node scripts/api/webflow/upload-assets.js` uploads all un-uploaded assets
- [x] Duplicate assets (by MD5 hash) are skipped
- [x] Oversized images (>4MB) are handled gracefully
- [x] `asset-manifest.json` is updated with `webflowAssetId` and `webflowUrl`
- [ ] Build-component can read `webflowUrl` from manifest when setting image sources

### Phase 4 (Metadata)
- [x] `update-metadata.js --dry-run` lists assets needing alt text without making changes
- [x] The `/asset-metadata` skill generates alt text via Claude vision and applies it

### Phase 5 (Style Extraction)
- [x] `extract-styles.js` outputs CSS-equivalent JSON for a given Figma node
- [x] Values are in rem (not px)
- [ ] Known utility classes are flagged as matches

### Phase 6 (SEO)
- [x] `update-seo.js --dry-run` shows current SEO state per page
- [x] The `/update-seo` skill generates and applies SEO metadata with user confirmation

### Phase 7 (Pipeline Integration)
- [ ] Build-component pipeline can automatically export and upload assets before building
- [ ] CLAUDE.md no longer says images must be pre-uploaded manually

## Dependencies & Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Figma PAT expires every 90 days | Medium — scripts fail with 401 | Clear error message with renewal URL; document rotation in reference docs |
| Webflow 4MB upload limit | Medium — large hero images rejected | Re-export at scale=1; if still oversized, skip with warning |
| Figma rate limits (10-20 req/min Tier 1) | Medium — slow exports for many assets | Batch node IDs in single API call; exponential backoff on 429 |
| Webflow beta SEO endpoint changes | Low — SEO script breaks | Document beta status; version-pin API calls; monitor changelog |
| Presigned S3 URL expiration | Low — upload fails if too slow | Upload immediately after receiving URL; retry on failure |
| Manifest corruption on crash | Low — lost tracking state | Atomic writes (temp file + rename); reconcile() for recovery |
| Figma image fill URLs expire (14 days) | Low — stale manifest | Always re-export; don't cache Figma download URLs in manifest |

## References & Research

### Internal
- Brainstorm: `docs/brainstorms/2026-03-14-api-utilities-brainstorm.md`
- Custom code plan (pattern precedent): `docs/plans/2026-03-14-feat-custom-code-delivery-workflow-plan.md`
- Custom code skill (pattern precedent): `.claude/skills/custom-code-management/SKILL.md`
- Build-component skill: `.claude/skills/build-component/SKILL.md`
- Current pipeline plan: `docs/plans/2026-03-12-feat-figma-to-webflow-automation-pipeline-plan.md`
- MCP limits memory: `memory/feedback_webflow_mcp_limits.md`

### External
- Figma REST API — Image Export: `GET /v1/images/:file_key`
- Figma REST API — Image Fills: `GET /v1/files/:file_key/images`
- Figma REST API — File Nodes: `GET /v1/files/:file_key/nodes`
- Figma REST API — Rate Limits (Nov 2025): 3-tier system, Tier 1 ~10-20/min
- Webflow Data API v2 — Asset Upload: `POST /v2/sites/:siteId/assets` (2-step S3 flow)
- Webflow Data API v2 — Update Asset: `PATCH /v2/sites/:siteId/assets/:assetId`
- Webflow Data API v2 — Page Settings: `PUT /beta/pages/:pageId`
- Webflow Data API v2 — Rate Limits: ~60 req/min (General), ~120 req/min (Business)
