# Upload Copy Skill — Brainstorm

**Date:** 2026-03-14
**Status:** Draft

## What We're Building

A skill (`/upload-copy`) that takes client copy from spreadsheets (.xlsx, .csv) or Word documents (.docx) and applies it to a Webflow site — both static page elements and CMS collection items. The skill auto-generates SEO metadata after uploading by chaining to `/update-seo`.

### Core Workflow

1. **Parse** — Read input files (single file or whole folder) and normalize to a common structure: `{ pages: [{ page, sections: [{ label, content }] }] }`
2. **Analyze Webflow** — Snapshot page structure (static) or list CMS collections/items (CMS)
3. **AI Match** — Claude matches spreadsheet section labels to Webflow elements/fields by semantic similarity
4. **Preview** — Show mapping table (source label → target element/field, current value → new value) for confirmation
5. **Apply** — Update static page elements via MCP `element_tool`, or create/update CMS items via `data_cms_tool`
6. **SEO** — Auto-run `/update-seo` on affected pages
7. **Report** — Summary: N elements updated, N CMS items created/updated, N skipped

### Input Formats Supported

| Format | Structure | Example |
|--------|-----------|---------|
| `.xlsx` (2-col) | Sheet = page, rows = `Section \| Content` | GTFO, STIL |
| `.xlsx` (3-col) | Sheet = page, rows = `Section \| Word Count \| Content` | EO |
| `.csv` | Same as 2 or 3-col xlsx | Google Sheets export |
| `.docx` | Heading styles = section labels, body = content, one doc per page | Pierpoint |
| Google Sheets URL | Auto-fetched as CSV via public export endpoint | Shared sheet link |
| Folder | All files in folder processed as batch | Pierpoint Category Pages |

### Content Routing

The skill determines whether content targets static page elements or CMS items:

- **Static page copy:** Section labels like "Hero Header", "About Description", "CTA" → matched to on-page elements
- **CMS collection items:** Structured/repeating content (rooms, expertise pages, blog posts) → matched to collection fields
- Claude analyzes the spreadsheet structure and Webflow site to recommend routing, user confirms

## Why This Approach

**MCP-first with thin parsing script** — chosen because:

- Already running with Webflow Designer open for builds
- MCP tools handle both static elements (`element_snapshot_tool` + `element_tool`) and CMS (`data_cms_tool`) well
- One code path instead of splitting between MCP and Data API
- AI matching happens naturally in the skill layer (Claude reads the snapshot + spreadsheet and proposes mappings)
- Only new script needed is the file parser (`parse-copy.js`)

## Key Decisions

1. **AI-assisted matching** — Claude matches section labels to Webflow elements semantically, shows mapping for confirmation. No enforced naming convention required.
2. **Auto-detect CMS collection + confirm** — Skill lists collections, suggests best match, user confirms.
3. **Upsert mode: ask each time** — Skill asks at the start whether to match-and-update existing items or create fresh.
4. **Auto-chain /update-seo** — SEO metadata generated and applied automatically after copy upload, no manual step.
5. **Batch processing** — Whole folders processed in one run (all .xlsx, .csv, .docx files).
6. **Parsing script only** — `scripts/api/webflow/parse-copy.js` handles file parsing and normalization. All Webflow operations go through MCP tools.
7. **Google Sheets URL support** — Skill accepts a Google Sheets share link and auto-fetches as CSV.
8. **Best-effort rich text** — Preserve bold/italic/links where possible, plain text fallback where MCP can't handle it.
9. **Localization-aware** — Use Webflow's localization features for translated content rather than simple content replacement.

## Skill Structure

```
.claude/skills/upload-copy/SKILL.md    # Skill definition
scripts/api/webflow/parse-copy.js       # File parser (xlsx, csv, docx)
```

### Allowed Tools
- `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`
- `mcp__webflow__element_snapshot_tool` (read page structure)
- `mcp__webflow__element_tool` (update element text)
- `mcp__webflow__data_cms_tool` (CMS operations)
- `mcp__webflow__data_sites_tool` (resolve siteId)
- `mcp__webflow__data_pages_tool` (list pages for matching)

### Dependencies
- `openpyxl` equivalent for Node.js → `xlsx` npm package
- `mammoth` or `docx` npm package for .docx parsing

## Resolved Questions

1. **Google Sheets live fetch** — Yes, accept a Google Sheets URL directly and auto-fetch via the public CSV export endpoint. The parsing script handles this alongside local files.
2. **Rich text formatting** — Best-effort rich text preservation. Attempt to keep bold/italic/links when applying to Webflow RichText elements, fall back to plain text where MCP can't handle it. Given the known MCP limitation on rich text child styling, this will work for element-level content but not for styling nested types within a RichText block.
3. **Multi-language support** — Localization-aware. Detect the target locale and use Webflow's localization features to apply translated content to the correct locale variant, rather than treating translations as a regular content swap.

## Additional Scope (added during planning)

### CMS Scaffold Mode
Sometimes CMS collections need to be created **before** copy is available. The skill has a second mode that:
1. Reads page elements from Webflow via `element_snapshot_tool`
2. Hypothesizes what content should be CMS-backed
3. Collaboratively proposes collection structure with user
4. Creates collection + fields with user approval

### CMS Naming Conventions (mandatory)
- **Collection emoji prefixes:** 📄 pages, 🖼️ rich content, 📦 plaintext/reference
- **Standard SEO fields:** `SEO - Meta Title`, `SEO - Meta Description` on all page-type collections
- **Section-prefixed field names:** `Hero - Title`, `Hero - Button Text`, `Image + Copy - Title`, etc.

## Open Questions

None — all questions resolved.
