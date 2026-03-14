---
name: update-seo
description: >
  Generate and apply SEO metadata (titles, descriptions, Open Graph tags) for
  Webflow pages. Analyzes page content to generate optimized metadata and
  applies via the Webflow Data API. Triggers on "update SEO", "set meta
  descriptions", "page metadata", or "Open Graph tags".
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - mcp__webflow__data_pages_tool
  - mcp__webflow__element_snapshot_tool
---

# Update SEO

You generate and apply SEO metadata for Webflow pages — page titles, meta
descriptions, and Open Graph tags. Uses page content analysis to generate
optimized, search-friendly metadata.

## Prerequisites

- `WEBFLOW_API_TOKEN` and `WEBFLOW_SITE_ID` in `.env`
- Webflow Designer open (for element_snapshot_tool content analysis)

## Workflow

### Step 1: Audit current SEO state

```bash
node scripts/api/webflow/update-seo.js --dry-run
```

This lists all pages and their current SEO metadata (title, description, OG tags).

### Step 2: Get page content

For each page needing SEO metadata:

1. Use `mcp__webflow__element_snapshot_tool` to get the page's element tree
2. Extract the main heading, subheadings, and body text
3. If Designer is not connected, note the page slug and ask the user to
   provide a brief description of the page content

### Step 3: Generate SEO metadata

For each page, generate:

- **SEO Title** — ≤60 characters. Include primary keyword near the start.
  Format: "Primary Keyword — Brand Name" or "Descriptive Title | Brand"
- **Meta Description** — ≤160 characters. Summarize page value proposition.
  Include a call-to-action. Make it compelling for search results.
- **OG Title** — Can be slightly different from SEO title. More conversational.
- **OG Description** — Can expand on meta description. Written for social sharing.

### Step 4: Preview and confirm

**IMPORTANT:** Always show proposed changes before applying.

Present a comparison table for each page:

| Field | Current | Proposed |
|-------|---------|----------|
| SEO Title | (empty) | New optimized title |
| Meta Desc | (empty) | New meta description |
| OG Title | (empty) | New OG title |
| OG Desc | (empty) | New OG description |

**Warn** if overwriting non-empty existing metadata. Ask for explicit
confirmation in that case.

### Step 5: Apply changes

After user confirms, apply via the Webflow API:

```javascript
// The update-seo.js script handles the PUT calls
// Or call directly for individual pages:
// webflowClient.updatePageSeo(pageId, { seoTitle, seoDescription, ogTitle, ogDescription })
```

### Step 6: Publish

Remind the user that SEO changes require a site publish to take effect.
Offer to run `/safe-publish` if they want to publish immediately.

## SEO Guidelines

### Titles
- ≤60 characters (Google truncates after ~60)
- Front-load the primary keyword
- Include brand name at the end
- Unique per page — no duplicates

### Meta Descriptions
- ≤160 characters (Google truncates after ~155-160)
- Include primary and secondary keywords naturally
- Write for humans, not search engines
- Include a value proposition or call-to-action
- Unique per page

### Open Graph
- OG Title can be more conversational than SEO title
- OG Description can be longer (up to 200 chars)
- Note: OG Image cannot be set via API — must be done in Webflow Designer

## Flags

- `--dry-run` — show current SEO state without making changes
- `--force` — update all pages, even those with existing SEO metadata
- `--page <slug>` — target a single page by its URL slug

## Important Notes

- The SEO metadata endpoint is `PUT /beta/pages/:pageId` — a beta API.
  If it breaks, check the Webflow API changelog for updates.
- Always confirm before overwriting existing metadata — it may have been
  hand-crafted by the client or an SEO specialist.
