---
title: "feat: Upload Copy Skill"
type: feat
status: active
date: 2026-03-14
---

# feat: Upload Copy Skill (`/upload-copy`)

## Overview

A skill that operates in two modes:

1. **Upload mode** — Takes client copy from spreadsheets (.xlsx, .csv), Word documents (.docx), or Google Sheets URLs and applies it to a Webflow site (static page elements + CMS items). Auto-generates SEO metadata afterward.
2. **Scaffold mode** — When copy isn't available yet, reads the Webflow page structure and collaboratively creates CMS collections with correct field structure, ready to be populated later.

Both modes apply consistent CMS naming conventions (emoji prefixes, section-prefixed fields, standard SEO fields).

**Brainstorm:** `docs/brainstorms/2026-03-14-upload-copy-skill-brainstorm.md`

## Problem Statement / Motivation

Client copy arrives in inconsistent formats (Excel, Word, Google Sheets) organized by page and section. Manually matching section labels to Webflow elements and pasting content is tedious, error-prone, and doesn't scale across multi-page sites or translations. The current pipeline automates Figma-to-Webflow builds but has no content ingestion path.

Additionally, CMS collections often need to be created **before** copy arrives — the page structure is known from the Figma build, but the content isn't ready yet. Currently this is done manually, leading to inconsistent field naming across projects.

## Proposed Solution

**MCP-first with thin parsing script.** A Node.js script (`parse-copy.js`) handles file parsing and normalization. The skill uses MCP tools for all Webflow operations — `element_snapshot_tool` + `element_tool` for static page copy, `data_cms_tool` for CMS items. Claude performs AI-assisted semantic matching between section labels and Webflow elements/fields.

**CMS scaffold mode** analyzes existing page elements via `element_snapshot_tool`, hypothesizes which content should be CMS-backed, proposes a collection structure following naming conventions, and creates it with user approval.

## Technical Approach

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     /upload-copy skill                        │
│                                                              │
│  MODE A: Upload (copy exists)                                │
│  ─────────────────────────────                               │
│  Input Files (.xlsx/.csv/.docx/URL/folder)                   │
│       │                                                      │
│       ▼                                                      │
│  parse-copy.js → normalized JSON                             │
│       │                                                      │
│       ▼                                                      │
│  Analyze Webflow (snapshot / CMS collections)                │
│       │                                                      │
│       ▼                                                      │
│  AI match labels → elements/fields                           │
│       │                                                      │
│       ▼                                                      │
│  Preview table → user confirms                               │
│       │                                                      │
│       ▼                                                      │
│  Apply (element_tool / data_cms_tool)                        │
│       │                                                      │
│       ▼                                                      │
│  Auto-run /update-seo → offer /safe-publish                  │
│                                                              │
│  MODE B: Scaffold (copy not yet available)                   │
│  ─────────────────────────────────────────                   │
│  Webflow page URL or page slug                               │
│       │                                                      │
│       ▼                                                      │
│  Snapshot page elements (element_snapshot_tool)               │
│       │                                                      │
│       ▼                                                      │
│  Hypothesize CMS structure from page sections                │
│       │                                                      │
│       ▼                                                      │
│  Propose collection (name, emoji, fields with prefixes)      │
│       │                                                      │
│       ▼                                                      │
│  User reviews + refines collaboratively                      │
│       │                                                      │
│       ▼                                                      │
│  Create collection + fields (data_cms_tool)                  │
└──────────────────────────────────────────────────────────────┘
```

### CMS Naming Conventions (applied in both modes)

**Collection name emoji prefixes:**
- 📄 — Page collections (e.g., "📄 Case Studies")
- 🖼️ — Rich content, not a page (e.g., "🖼️ Testimonials")
- 📦 — Plaintext/reference collections (e.g., "📦 Blog Categories")

**Standard fields on every page-type collection:**
- `SEO - Meta Title` (PlainText)
- `SEO - Meta Description` (PlainText)

**Field naming — section prefix convention:**
- Fields are prefixed with the section they belong to: `Hero - Title`, `Hero - Button Text`, `Image + Copy - Title`, `Image + Copy - Description`
- This groups related fields visually in the Webflow CMS editor

### Implementation Phases

#### Phase 1: Parsing Script (`scripts/api/webflow/parse-copy.js`)

**Deliverables:**
- [x] Add `xlsx` and `mammoth` to `package.json` dependencies — `parse-copy.js`
- [x] Add `"parse-copy"` script to `package.json` — `package.json`
- [x] Implement file parser with format auto-detection — `scripts/api/webflow/parse-copy.js`
- [x] Google Sheets URL fetch via public CSV export endpoint — `scripts/api/webflow/parse-copy.js`
- [x] Folder mode: glob all `.xlsx`, `.csv`, `.docx` files, skip unrecognized types — `scripts/api/webflow/parse-copy.js`

**Normalized output schema:**

```json
{
  "source": "docs/examples/GTFO-Content-Final-Updated.xlsx",
  "pages": [
    {
      "page": "Homepage",
      "locale": null,
      "sections": [
        {
          "label": "Hero Header",
          "content": "It's time to GTFO.",
          "richText": false
        },
        {
          "label": "Under Header",
          "content": "GTFO travel specialists tell it like it is...",
          "richText": true,
          "richTextHtml": "<p>GTFO travel specialists <strong>tell it like it is</strong>...</p>"
        }
      ]
    }
  ],
  "skippedFiles": ["Pierpoint - Tone of Voice.docx"]
}
```

**Format detection rules:**

| Format | Detection | Page name source | Section label source |
|--------|-----------|-----------------|---------------------|
| `.xlsx` 2-col | Columns A-B, row 1 header contains "Section" and "Content" | Sheet name | Column A value |
| `.xlsx` 3-col | Columns A-C, row 1 header contains "Word Count" | Sheet name | Column A value |
| `.csv` | File extension `.csv` | Filename (minus extension) | First column value |
| `.docx` | File extension `.docx` | Filename (minus extension and common prefixes like "Pierpoint - ") | Heading style text |
| Google Sheets | URL starts with `https://docs.google.com/spreadsheets/` | Sheet name (fetched as multi-sheet CSV) | First column value |
| Folder | `fs.stat().isDirectory()` | Each file's page name rule above | Each file's label rule above |

**Locale detection:** Check filename for language codes (`-nl`, `-fr`, `-de`, `-es` before extension or `.FINAL`). Check sheet names for locale indicators. If detected, populate `locale` field. If ambiguous, leave `null` — skill asks user.

**Rows with empty content are skipped.** The word-count column (3-col format) is discarded.

**CLI interface:**

```bash
# Single file
pnpm parse-copy docs/examples/GTFO-Content-Final-Updated.xlsx

# Folder
pnpm parse-copy "docs/examples/pier point copy"

# Google Sheets URL
pnpm parse-copy "https://docs.google.com/spreadsheets/d/SHEET_ID/edit"

# Output: JSON to stdout, diagnostics to stderr
```

**Rich text detection (Word docs):** `mammoth` outputs HTML with `<strong>`, `<em>`, `<a href>` tags. If the HTML contains any of these tags, `richText: true` and `richTextHtml` is populated. For xlsx/csv, content is always plain text (`richText: false`).

**Non-copy file handling:** Files that don't match any format pattern (PDFs, images, .docx files with no heading styles) are listed in `skippedFiles` array and logged to stderr.

#### Phase 2: Skill Definition (`.claude/skills/upload-copy/SKILL.md`)

**Deliverables:**
- [x] Write SKILL.md with full workflow — `.claude/skills/upload-copy/SKILL.md`

**Skill workflow steps:**

##### Step 1: Parse Input
- Run `pnpm parse-copy <path>` where `<path>` is provided by the user (file, folder, or URL)
- Read JSON output from stdout
- Report: "Parsed N pages, M sections. Skipped: [list]"
- If `locale` detected on any page, announce it and confirm with user

##### Step 2: Analyze Webflow
- **Check Designer status first.** If content includes static page targets, Designer must be open. If all content routes to CMS, Designer is not required.
- Use `data_sites_tool → list_sites` to resolve siteId
- Use `data_pages_tool → list pages` to get all Webflow page names and slugs
- **Page matching rule:** Fuzzy-match each parsed `page` name against Webflow page display names and slugs. Show matches in a table, flag uncertain matches (confidence < 80%), ask user to confirm or correct.
- For pages that match: use `element_snapshot_tool` to get element tree (static path)
- For CMS routing: use `data_cms_tool → get_collection_list` then `get_collection_details` for schema

##### Step 3: Route Content
- Claude analyzes each page's section structure against the Webflow page elements and CMS collections
- **Static indicators:** Small number of sections with unique labels (Hero Header, About, CTA), matching on-page heading/text elements
- **CMS indicators:** Repeating pattern of labels (Room 1 Title / Room 1 Description / Room 2 Title / Room 2 Description), matching CMS collection fields
- Show routing recommendation, user confirms per page

##### Step 4: AI Match
**Static path:**
- Compare section labels to element text content, class names, and position in the tree
- Filter target elements to text-bearing types only: Heading, Paragraph, Text, Link, Button (text content), ListItem. **Skip RichText containers** — flag them as "requires manual update."
- Handle ambiguity: if a label matches multiple elements, show all candidates ranked by confidence. If a label matches nothing, mark as "unmatched."
- Detect conflicts: if two labels map to the same element, surface in preview.

**CMS path:**
- Ask upsert mode: "Match and update existing items, or create fresh?"
- Match section labels to collection field `displayName` values
- **Match key for upsert:** Use item `name` field (the CMS item title). If duplicates exist, warn and ask user to disambiguate.
- Surface required fields that are missing from the copy file — these will block creation.

##### Step 5: Preview
Show a mapping table for user confirmation:

**Static page preview:**
```
| Page     | Section Label  | Target Element        | Current Text (truncated) | New Text (truncated) | Status    |
|----------|---------------|-----------------------|--------------------------|---------------------|-----------|
| Homepage | Hero Header   | h1.heading-style-h1   | "Welcome"                | "It's time to GTFO" | ✓ Match   |
| Homepage | Under Header  | p.text-size-large      | "Lorem ipsum..."         | "GTFO travel..."    | ✓ Match   |
| Homepage | CTA           | —                     | —                        | "Book Now"          | ⚠ No match |
```

**CMS preview (create mode):**
```
| Collection | Item Name     | Field           | Value (truncated)       | Status      |
|------------|---------------|-----------------|------------------------|-------------|
| Rooms      | Kamer 1       | Description     | "Deze gezellige..."    | ✓ New item  |
| Rooms      | Kamer 1       | Amenities       | "10 m² badkamer..."    | ✓ New item  |
| Rooms      | —             | Check-in Date   | —                      | ⚠ Required  |
```

**User can reject the whole batch and re-run with an edited source file.** Approval is all-or-nothing (simpler UX). Unmatched and skipped items are listed but not applied.

##### Step 6: Apply
**Static path:**
- Call `element_tool → set_text` for each confirmed mapping
- After setting text, update `aria-label` on the same element with the new text content (accessibility sync)
- For elements with `richText: true` in the source — attempt `set_text` with the HTML content. If the element type is RichText container, skip and add to "manual update needed" list.
- Log progress: "Applying section N of M on page X..."

**CMS path:**
- Batch items into arrays of up to 100 per API call
- Call `data_cms_tool → create_collection_items` (create mode) or `update_collection_items` (update mode)
- After apply, ask: "Publish CMS items now or leave as drafts?" If publish, call `data_cms_tool → publish_collection_items`.

**Localization path:**
- If `locale` is set, use the Webflow localization API to apply content to the specified locale variant rather than the default locale.
- If the locale is not yet enabled on the site, warn the user and skip localized content.

##### Step 7: SEO Auto-chain
- Auto-invoke `/update-seo` on all affected pages
- Pass the list of affected page slugs so `/update-seo` scopes its work
- For CMS items, `/update-seo` runs on the collection template page
- SEO preview is shown as a single consolidated table (not per-page prompts) for batch UX

##### Step 8: Report + Publish
- Summary: N elements updated, N CMS items created, N CMS items updated, N skipped (unmatched), N manual (RichText)
- List any items flagged for manual update (RichText containers, required CMS fields missing)
- Offer: "Run `/safe-publish` to push changes live?"

**Allowed tools:**
```yaml
allowed-tools:
  - Bash
  - "Bash(pnpm parse-copy:*)"
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Skill
  - mcp__webflow__element_snapshot_tool
  - mcp__webflow__element_tool
  - mcp__webflow__data_cms_tool
  - mcp__webflow__data_sites_tool
  - mcp__webflow__data_pages_tool
```

#### Phase 2B: Scaffold Mode Workflow (within SKILL.md)

The skill detects scaffold mode when invoked without a file/folder path, or when the user says "scaffold CMS" / "create CMS structure" / "set up collections."

##### Scaffold Step 1: Identify Target Pages
- Use `data_sites_tool → list_sites` to resolve siteId
- Use `data_pages_tool → list pages` to show all pages
- Ask user which pages need CMS backing (or "all")
- Use `element_snapshot_tool` to get the element tree for each selected page

##### Scaffold Step 2: Analyze Page Structure
- Claude examines the element tree and identifies repeating content patterns
- Groups elements by section (using class name prefixes like `hero_`, `features_`, `testimonials_`)
- For each group, hypothesizes:
  - Whether it should be a CMS collection or static
  - What fields are needed (Title, Description, Image, Button Text, Button URL, etc.)
  - The field type (PlainText, RichText, Image, Link)
  - The collection type (📄 page, 🖼️ rich content, 📦 plaintext)

##### Scaffold Step 3: Propose Collection Structure
Present a structured proposal for user review:

```
Proposed CMS Collection: 📄 Case Studies
──────────────────────────────────────────
Based on: /case-studies page elements

Fields:
  Hero - Title            PlainText
  Hero - Subtitle         PlainText
  Hero - Background Image Image
  Content - Title         PlainText
  Content - Body          RichText
  Content - Image         Image
  CTA - Button Text       PlainText
  CTA - Button URL        Link
  SEO - Meta Title        PlainText
  SEO - Meta Description  PlainText

Shall I create this collection? You can:
- Add/remove/rename fields
- Change field types
- Change the collection emoji/name
- Split into multiple collections
```

##### Scaffold Step 4: Collaborative Refinement
- User can modify the proposal (rename fields, change types, add/remove)
- Claude applies section-prefix conventions automatically
- Always includes `SEO - Meta Title` and `SEO - Meta Description` on page-type collections
- Continue refining until user approves

##### Scaffold Step 5: Create Collection
- Call `data_cms_tool → create_collection` with the approved name (including emoji prefix)
- Call `data_cms_tool → create_collection_static_field` for each field
- Report: "Created collection '📄 Case Studies' with N fields"
- Remind: "Collection is ready. Run `/upload-copy <file>` when copy is available to populate items."

#### Phase 3: Spike — Element ID Stability & RichText Behavior

Before the skill can be used for static page copy, validate two assumptions:

- [ ] **Spike: element_snapshot_tool ID stability** — Confirm that element IDs returned by `element_snapshot_tool` remain valid for `element_tool → set_text` calls within the same Designer session. Document in `docs/spike-results.md`.
- [ ] **Spike: set_text on RichText elements** — Call `element_tool → set_text` on a RichText container element. Document whether it: (a) works, (b) fails with a clear error, or (c) silently corrupts. This determines the fallback strategy.

#### Phase 4: Localization Research

- [ ] **Research: Webflow localization API via MCP** — Determine which MCP tool(s) support locale-targeted content updates. Check `data_cms_tool` and `element_tool` for locale parameters. If no MCP support exists, determine the Data API endpoint and whether to add a method to `webflow-client.js`.
- [ ] **Research: Webflow locales endpoint** — `GET /v2/sites/:siteId/locales` to list available locales. Add `listLocales()` to `webflow-client.js` if needed.

## Acceptance Criteria

### Upload Mode
- [ ] `pnpm parse-copy <file>` correctly parses all three example formats (EO 3-col, GTFO 2-col, Pierpoint .docx) and outputs valid normalized JSON
- [ ] `pnpm parse-copy <folder>` processes all files in a folder, skips non-copy files, reports skipped files
- [ ] `pnpm parse-copy <google-sheets-url>` fetches and parses a public Google Sheet
- [ ] `/upload-copy` matches section labels to Webflow page elements with >80% accuracy on the example files
- [ ] Preview table shows current vs. new values for all matched elements before any changes are applied
- [ ] Static page copy applied via `element_tool → set_text` with `aria-label` sync
- [ ] CMS items created/updated via `data_cms_tool` with correct upsert behavior
- [ ] `/update-seo` auto-runs on affected pages after copy apply
- [ ] Publish reminder shown at end of workflow
- [ ] RichText containers detected and flagged for manual update (not silently skipped)
- [ ] Locale detected from filename and confirmed with user before applying to non-default locale

### Scaffold Mode
- [ ] Scaffold mode triggered when no file path provided or user says "scaffold CMS"
- [ ] Page elements analyzed and grouped by section
- [ ] Collection proposal uses correct emoji prefix (📄/🖼️/📦) based on collection type
- [ ] Fields use section-prefix naming convention (`Hero - Title`, `Content - Body`, etc.)
- [ ] `SEO - Meta Title` and `SEO - Meta Description` auto-included on page-type collections
- [ ] User can add, remove, rename fields and change types before creation
- [ ] Collection and fields created via `data_cms_tool` after user approval

### CMS Conventions (both modes)
- [ ] New CMS collections follow emoji prefix convention
- [ ] Field names follow section-prefix convention
- [ ] When uploading copy to an existing CMS collection, field mapping respects section prefixes

## Dependencies & Risks

### Dependencies
- **npm packages:** `xlsx` (Excel/CSV parsing), `mammoth` (.docx → HTML). First runtime dependencies in this project.
- **Designer open:** Required for static page copy path (element_snapshot + element_tool). CMS path works without Designer.
- **Webflow localization:** Requires site to have localization enabled for translation workflows.

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Element IDs stale between snapshot and apply | Apply targets wrong elements | Spike in Phase 3; re-snapshot before apply if session changed |
| set_text on RichText corrupts content | Data loss on page | Spike in Phase 3; detect and skip RichText elements |
| Google Sheets URL is private (not published) | Fetch returns HTML login page | Detect non-CSV response, inform user to publish sheet or download manually |
| CMS upsert matches wrong item (duplicate names) | Wrong content on wrong item | Warn on duplicate names, ask user to disambiguate |
| Large batch (300+ MCP calls) is slow | User thinks skill hung | Progress logging every 5 elements |
| xlsx package processes malicious file | Security risk | Parse in subprocess, no macro execution (xlsx defaults to safe mode) |

## File Manifest

| File | Action | Purpose |
|------|--------|---------|
| `scripts/api/webflow/parse-copy.js` | Create | File parser (xlsx, csv, docx, Google Sheets) |
| `.claude/skills/upload-copy/SKILL.md` | Create | Skill definition |
| `package.json` | Edit | Add `xlsx`, `mammoth` dependencies + `parse-copy` script |
| `.gitignore` | ~~Edit~~ Done | Already done — `docs/examples/` added |
| `docs/spike-results.md` | Edit | Add element ID stability + RichText spike results |

## References & Research

### Internal References
- Brainstorm: `docs/brainstorms/2026-03-14-upload-copy-skill-brainstorm.md`
- Skill pattern: `.claude/skills/update-seo/SKILL.md` (closest analog)
- Script pattern: `scripts/api/webflow/update-seo.js` (CLI flag conventions)
- Shared client: `scripts/api/lib/webflow-client.js` (extension point for locales)
- MCP limitations: `CLAUDE.md:127-131` (RichText, form elements, inline styles)
- Asset pipeline pattern: `docs/solutions/integration-issues/mcp-api-gap-asset-pipeline.md`

### Example Input Files
- `docs/examples/GTFO-Content-Final-Updated.xlsx` — 2-col format
- `docs/examples/EO-NEWPAGES-REQUEST-NEWEST.xlsx` — 3-col format
- `docs/examples/STIL-TRANSLATION-NL- FINAL.xlsx` — translation with locale
- `docs/examples/pier point copy/` — .docx folder (13 files)
