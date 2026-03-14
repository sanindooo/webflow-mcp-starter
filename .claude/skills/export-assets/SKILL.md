---
name: export-assets
description: >
  Export images, icons, and logos from a Figma design and upload them to the
  Webflow asset library. Parses a Figma URL to extract fileKey and nodeId,
  runs the export script, optionally uploads to Webflow, and displays the
  asset manifest. Triggers on "export assets", "download images from Figma",
  "upload assets to Webflow", or when build-component needs images.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Export Assets

You export images, icons, and logos from Figma designs and upload them to the
Webflow asset library. This bridges the gap between the Figma MCP (which can't
export individual assets) and the Webflow MCP (which can't upload images).

## Prerequisites

- `FIGMA_API_TOKEN` in `.env` (for Figma export)
- `WEBFLOW_API_TOKEN` and `WEBFLOW_SITE_ID` in `.env` (for Webflow upload)

Check these exist before proceeding. If missing, tell the user what to add.

## Input

Accept one of:
- A **Figma URL** — parse fileKey and nodeId from it:
  - `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId
  - `figma.com/design/:fileKey/branch/:branchKey/:fileName` → use branchKey as fileKey
- Explicit **fileKey** and **nodeId** arguments

## Workflow

### Step 1: Export from Figma

```bash
node scripts/api/figma/export-assets.js <fileKey> <nodeId>
```

This:
- Walks the Figma node tree
- Downloads image fills (photos/backgrounds) as original quality files
- Exports icons as SVG (with text outlined)
- Exports logos as SVG
- Saves everything to `assets/images/`, `assets/icons/`, `assets/logos/`
- Generates `assets/asset-manifest.json`

### Step 2: Review manifest

Read `assets/asset-manifest.json` and display a summary:
- Number of images, icons, logos exported
- Any warnings (missing image refs, hidden nodes skipped)
- Total file count and approximate size

### Step 3: Upload to Webflow (optional)

Ask the user if they want to upload now. If yes:

```bash
node scripts/api/webflow/upload-assets.js
```

This:
- Reads the manifest
- Computes MD5 hashes for deduplication
- Skips assets that already exist in Webflow (same hash)
- Uploads new assets via presigned S3 URLs
- Updates the manifest with `webflowAssetId` and `webflowUrl`
- Handles oversized files (>4MB) gracefully

### Step 4: Summary

Display final manifest state:
- Uploaded: N assets
- Duplicates skipped: N
- Oversized: N (list them so user can resize manually)

## Integration with Build Pipeline

When called from `build-component`, the manifest's `webflowUrl` field is used
by `element_tool -> set_image` to set image sources on Webflow elements.

The `context.component` and `context.layerPath` fields help match assets to
the correct elements in the design.

## Error Recovery

- If export fails midway: the manifest is saved incrementally. Re-running
  will upsert new entries without losing previous ones.
- If upload fails: each asset is saved to manifest after upload. Re-running
  will skip already-uploaded assets.
- If a file is oversized: it's marked `status: "oversized"` in the manifest.
  Tell the user to resize it manually, then re-run upload.
