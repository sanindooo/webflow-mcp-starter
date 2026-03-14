---
title: "Bridging Figma/Webflow MCP gaps with REST API utilities"
category: integration-issues
component: scripts/api
tags:
  - figma-api
  - webflow-api
  - asset-export
  - asset-upload
  - mcp-gap
  - rest-api
  - ssrf-prevention
  - code-review
severity: medium
root_cause: "MCP servers don't expose full REST API surface — Figma MCP cannot export assets as files, Webflow MCP cannot upload to asset library or set page SEO metadata"
date_resolved: 2026-03-14
commit: c3ab0e9
---

# Bridging Figma/Webflow MCP Gaps with REST API Utilities

## Problem

The Figma-to-Webflow automation pipeline had a manual bottleneck: image handling. Two MCP limitations created the gap:

- **Figma MCP** only provides `get_screenshot` (full-frame rasterization). It cannot export individual image fills (photos, backgrounds) or vector nodes (icons, logos) as standalone files.
- **Webflow MCP** cannot upload images to the asset library, update asset alt text, or set page SEO metadata.

This forced a manual workflow: download from Figma, upload to Webflow, record asset URLs by hand — before any automated building could begin.

## Root Cause

Both MCP servers are optimized for their primary use cases (design-to-code translation and visual building) and intentionally omit lower-level REST API operations. The Figma REST API supports image export (`GET /v1/images/:file_key`) and image fill extraction (`GET /v1/files/:file_key/images`). The Webflow Data API v2 supports 2-step presigned S3 uploads (`POST /v2/sites/:siteId/assets`). Neither capability is exposed through the MCP servers.

## Solution

Built a suite of Node.js scripts in `scripts/api/` with zero new dependencies (native `fetch` and `crypto` on Node 18+) that call both REST APIs directly:

### Architecture

```
scripts/api/
  lib/
    figma-client.js       # Figma REST API client (auth, rate limiting, backoff)
    webflow-client.js     # Webflow Data API client (auth, S3 upload, backoff)
    manifest.js           # Asset manifest read/write/upsert utilities
  figma/
    export-assets.js      # Walk node tree, classify assets, download to assets/
    extract-styles.js     # Extract exact CSS values (px→rem) from Figma nodes
  webflow/
    upload-assets.js      # Upload to Webflow via presigned S3, dedup by MD5
    update-metadata.js    # List/update asset alt text
    update-seo.js         # List/update page SEO metadata

assets/                   # Local asset storage (git-ignored)
  images/, icons/, logos/
  asset-manifest.json     # Tracks each asset: Figma → local → Webflow
```

### Key Design Decisions

1. **Manifest-driven pipeline** — `asset-manifest.json` uses `figmaNodeId` as unique key. Each entry tracks status through `exported` → `uploaded` (or `oversized`, `missing_locally`). Enables idempotent re-runs.
2. **Buffer-passing** — File read once into Buffer, passed to both hash computation and upload. Eliminates the double-read bug.
3. **Domain-restricted auth** — Both clients validate URLs against hostname allowlists before sending tokens. Prevents SSRF.
4. **Exponential backoff with jitter** — `Math.pow(2, attempt) * 1000 + Math.random() * 1000` on both 429 and 5xx retries. Prevents thundering herd.

### Figma Export Flow

```
1. GET /v1/files/:fileKey/nodes?ids=<nodeId>  → walk tree, collect imageRefs + SVG nodes
2. GET /v1/files/:fileKey/images              → download URLs for all image fills
3. GET /v1/images/:fileKey?ids=...&format=svg → batch export icons/logos as SVG
4. Download files to assets/{images,icons,logos}/
5. Write asset-manifest.json with metadata
```

### Webflow Upload Flow

```
1. Read asset-manifest.json → filter un-uploaded entries
2. For each: read file, compute MD5, check against existing Webflow assets (dedup)
3. POST /v2/sites/:siteId/assets {fileName, fileHash} → get presigned S3 URL
4. POST to S3 uploadUrl with uploadDetails + file blob
5. Update manifest with webflowAssetId and webflowUrl
```

## Code Review Findings Fixed

The initial implementation was reviewed by 5 parallel agents (security, performance, architecture, simplicity, JS patterns). Key bugs caught and fixed:

| Finding | Severity | Fix |
|---------|----------|-----|
| SSRF: tokens sent to arbitrary URLs | HIGH | Domain allowlists on both clients + HTTPS-only downloads |
| `opts.body`/`opts.json` silent overwrite | CRITICAL | Guard + `else if` prevents both being set |
| Double file read on upload (2x memory) | HIGH | Read once, pass buffer + precomputed hash |
| Unreachable `letterSpacing === 0` branch | MEDIUM | Changed guard to `!== undefined` |
| Last-shadow-wins (multiple shadows lost) | MEDIUM | Collect into array, join with commas |
| No jitter in exponential backoff | MEDIUM | Added `Math.random() * 1000` |
| Error messages leak full API responses | MEDIUM | Truncated to 500 chars |
| 5 unused methods (YAGNI) | LOW | Removed `getAsset`, `createAssetFolder`, `publishSite`, `getFileComponents`, `getFileStyles` |
| `reconcile()` duplicated by upload loop | LOW | Removed |
| `rasterNodes` declared but never used | LOW | Removed |

## Prevention Checklist

For future API client code in this project:

### Security (always apply)
- [ ] Validate outgoing URLs against hostname allowlists before sending auth tokens
- [ ] Never include tokens in error messages or logs
- [ ] Truncate upstream API error responses before surfacing (500 char max)
- [ ] Enforce HTTPS-only on download URLs
- [ ] Validate env tokens at construction, not at first use

### Correctness (always apply)
- [ ] Guard mutually exclusive options (`body` vs `json`) — throw on conflict, never silently overwrite
- [ ] Collect aggregated values (shadows, transforms) into arrays — never assign in a loop
- [ ] Verify every code branch is reachable (watch for JS falsy `0`)
- [ ] Add jitter to exponential backoff — `delay * (1 + Math.random())`

### Performance (apply for batch operations)
- [ ] Read files once, pass buffers — never re-read for hashing and uploading
- [ ] Check file size before reading into memory (skip oversized early)
- [ ] Use streaming for files > 50MB (not needed for typical Webflow 4MB limit)

## Code Review Patterns That Caught These Bugs

1. **"Follow the Data"** — Trace every token/URL from origin to consumption. Caught SSRF.
2. **"Last Write Wins"** — Search for assignment inside loops. Caught shadow overwrite.
3. **"Dead Branch Detection"** — Verify each `if` branch can execute. Caught letterSpacing.
4. **"Mutual Exclusion Audit"** — Check functions accepting multiple optional body params. Caught opts.body/json.
5. **"Grep for Dead Code"** — Search exports with zero call sites. Caught 5 unused methods.

## Related Documentation

- Brainstorm: `docs/brainstorms/2026-03-14-api-utilities-brainstorm.md`
- Plan: `docs/plans/2026-03-14-feat-api-utilities-figma-webflow-plan.md`
- Skills: `.claude/skills/export-assets/`, `.claude/skills/asset-metadata/`, `.claude/skills/update-seo/`
- Custom code precedent: `docs/plans/2026-03-14-feat-custom-code-delivery-workflow-plan.md`
- Pipeline plan: `docs/plans/2026-03-12-feat-figma-to-webflow-automation-pipeline-plan.md`

## Remaining Work

- **Phase 7**: Wire `/export-assets` into `build-component` pipeline as Phase 2.5
- **Phase 8**: Create `docs/reference/api-utilities.md` with full usage docs
- **extract-styles.js**: Add utility class matching against CLAUDE.md conventions
