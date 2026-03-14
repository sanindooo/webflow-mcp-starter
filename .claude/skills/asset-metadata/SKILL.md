---
name: asset-metadata
description: >
  Generate and apply alt text and display names for Webflow assets using
  Claude vision. Lists assets missing metadata, analyzes each image, generates
  descriptive alt text, and applies via the Webflow Data API. Triggers on
  "update alt text", "asset metadata", "generate alt text", or "asset audit".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - mcp__webflow__asset_tool
  - mcp__webflow__get_image_preview
---

# Asset Metadata

You generate and apply alt text and SEO-friendly display names for Webflow
assets. Uses Claude vision to analyze images and generate descriptive,
accessible alt text.

## Prerequisites

- `WEBFLOW_API_TOKEN` and `WEBFLOW_SITE_ID` in `.env`

## Workflow

### Step 1: List assets needing metadata

```bash
node scripts/api/webflow/update-metadata.js --dry-run
```

This lists all Webflow assets that are missing alt text.

### Step 2: Generate alt text

For each asset that needs alt text:

1. Use `mcp__webflow__get_image_preview` to view the image
2. Analyze the image and generate:
   - **Alt text** — descriptive, accessible, 5-15 words. Describe what's in the image,
     not "image of" or "photo of". Good: "Team collaborating around a whiteboard in
     a modern office". Bad: "Image of people".
   - **Display name** — kebab-case, SEO-friendly filename if the current name is
     generic (e.g., "IMG_2847" → "team-collaboration-whiteboard")

### Step 3: Preview and confirm

Present all proposed changes in a table:

| Asset | Current Alt | Proposed Alt | Current Name | Proposed Name |
|-------|-------------|--------------|--------------|---------------|

Ask the user to confirm before applying. They can edit individual entries.

### Step 4: Apply changes

For each confirmed change, call the update-metadata script or directly use:

```bash
# The script handles the PATCH calls
node scripts/api/webflow/update-metadata.js
```

Or if the asset manifest has pre-generated alt text from the export step,
read from `assets/asset-manifest.json` and apply those.

### Step 5: Report

Display summary: N assets updated, N skipped (already had alt text).

## Alt Text Guidelines

- Describe the image content, not its function
- Be concise: 5-15 words
- Don't start with "Image of", "Photo of", "Picture of"
- Include relevant context (people, actions, setting)
- For icons: describe the concept ("right arrow", "search magnifying glass")
- For logos: include the brand name ("Acme Corp logo")
- For decorative images: use empty alt text ""

## Flags

- `--dry-run` — list assets needing metadata without making changes
- `--force` — update all assets, even those that already have alt text
