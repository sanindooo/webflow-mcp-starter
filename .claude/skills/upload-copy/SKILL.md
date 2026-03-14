---
name: upload-copy
description: >
  Upload client copy from spreadsheets or Word docs to a Webflow site (static
  pages + CMS items), or scaffold CMS collections from page structure. Parses
  .xlsx, .csv, .docx, and Google Sheets URLs. Auto-runs /update-seo after
  upload. Triggers on "upload copy", "add copy", "import content", "scaffold
  CMS", "create CMS structure", or "set up collections".
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
---

# Upload Copy

You upload client copy to Webflow pages and CMS collections, or scaffold CMS
collection structures from existing page elements. Two modes:

- **Upload mode** — parse a copy document, match content to Webflow elements or
  CMS fields, preview, apply, then auto-run `/update-seo`
- **Scaffold mode** — read page structure, hypothesize CMS fields, propose a
  collection with naming conventions, create after user approval

## Prerequisites

- `WEBFLOW_API_TOKEN` and `WEBFLOW_SITE_ID` in `.env`
- Webflow Designer open (required for static page copy; not needed for CMS-only)

## CMS Naming Conventions (mandatory)

Always apply these when creating or matching CMS collections:

**Collection name emoji prefixes:**
- 📄 — Page collections (e.g., "📄 Case Studies")
- 🖼️ — Rich content, not a page (e.g., "🖼️ Testimonials")
- 📦 — Plaintext/reference collections (e.g., "📦 Blog Categories")

**Standard fields on every page-type collection:**
- `SEO - Meta Title` (PlainText)
- `SEO - Meta Description` (PlainText)

**Field naming — section prefix convention:**
- Prefix fields with their section: `Hero - Title`, `Hero - Button Text`,
  `Image + Copy - Title`, `Content - Body`

## Mode Detection

- **Upload mode:** User provides a file path, folder path, or Google Sheets URL
- **Scaffold mode:** User says "scaffold CMS", "create CMS structure", "set up
  collections", or invokes without a file path

---

## Upload Mode Workflow

### Step 1: Parse Input

Run the parsing script on the user's file, folder, or URL:

```bash
pnpm parse-copy <path-or-url>
```

The script outputs normalized JSON to stdout:

```json
{
  "pages": [
    {
      "page": "Homepage",
      "locale": null,
      "sections": [
        { "label": "Hero Header", "content": "...", "richText": false }
      ]
    }
  ],
  "skippedFiles": []
}
```

Report: "Parsed N pages, M total sections. Skipped: [list]"

If `locale` is detected (e.g., `nl`, `fr`), announce it and confirm with user
before applying to a non-default locale.

### Step 2: Analyze Webflow

1. Use `data_sites_tool → list_sites` to resolve siteId
2. Use `data_pages_tool → list pages` to get all Webflow page names and slugs
3. **Page matching:** Fuzzy-match each parsed `page` name against Webflow page
   display names and slugs. Show a matching table and ask user to confirm or
   correct. Flag uncertain matches.
4. For matched pages: use `element_snapshot_tool` to get the element tree
5. Use `data_cms_tool → get_collection_list` then `get_collection_details` to
   understand CMS schema

### Step 3: Route Content

Analyze each page's section structure and recommend routing:

- **Static page copy:** Few sections with unique labels (Hero Header, About,
  CTA) matching on-page text elements
- **CMS collection items:** Repeating label patterns (Room 1 Title / Room 1
  Description / Room 2 Title) matching CMS collection fields

Show routing recommendation per page. User confirms.

### Step 4: AI Match

**Static path:**
- Compare section labels to element text content, class names, and position
- Filter to text-bearing element types only: Heading, Paragraph, Text, Link,
  Button text, ListItem
- **Skip RichText containers** — flag as "requires manual update in Designer"
- If a label matches multiple elements, show all candidates ranked by confidence
- If a label matches nothing, mark as "unmatched"
- If two labels map to the same element, flag the conflict

**CMS path:**
- Ask upsert mode: "Match and update existing items, or create fresh?"
- Match section labels to collection field `displayName` values (respecting
  section-prefix conventions)
- **Match key for upsert:** Use item `name` field. Warn if duplicate names exist.
- Surface required fields missing from the copy file before attempting creation

### Step 5: Preview

**IMPORTANT:** Always show proposed changes before applying.

**Static page preview:**

| Page | Section Label | Target Element | Current Text | New Text | Status |
|------|--------------|----------------|-------------|----------|--------|
| Homepage | Hero Header | h1.heading-style-h1 | "Welcome" | "It's time to GTFO" | Match |
| Homepage | CTA | — | — | "Book Now" | No match |

**CMS preview (create mode):**

| Collection | Item Name | Field | Value | Status |
|------------|-----------|-------|-------|--------|
| 📄 Rooms | Kamer 1 | Hero - Title | "Deze gezellige..." | New item |
| 📄 Rooms | — | Check-in Date | — | Required field missing |

User approves or rejects the whole batch. Unmatched items are listed but not
applied.

### Step 6: Apply

**Static path:**
- Call `element_tool → set_text` for each confirmed mapping
- After setting text, update `aria-label` on the same element with the new
  readable text (accessibility sync)
- For `richText: true` source content where the target is NOT a RichText
  container, attempt `set_text` with plain text content
- Log progress: "Applying section N of M on page X..."

**CMS path:**
- Batch items into arrays of up to 100 per API call
- Call `data_cms_tool → create_collection_items` (create) or
  `update_collection_items` (update)
- After apply, ask: "Publish CMS items now or leave as drafts?"
- If publish, call `data_cms_tool → publish_collection_items`

**Localization path (not yet automated):**
- If `locale` is set in the parsed output, warn the user that localization
  requires manual application in Webflow Designer's locale switcher
- The Webflow MCP tools do not currently support locale-targeted content updates
- Log which pages/items have locale-tagged content so the user knows what to
  apply manually after the default-locale content is set

### Step 7: Run SEO

Invoke `/update-seo` on all affected pages. Note: `/update-seo` is interactive
and will show its own preview table for confirmation before applying SEO
metadata. For CMS items, run on the collection template page.

### Step 8: Report + Publish

Display summary:
- N elements updated
- N CMS items created
- N CMS items updated
- N skipped (unmatched)
- N flagged for manual update (RichText containers)

List items needing manual attention. Offer: "Run `/safe-publish` to push
changes live?"

---

## Scaffold Mode Workflow

### Scaffold Step 1: Identify Target Pages

1. Use `data_sites_tool → list_sites` to resolve siteId
2. Use `data_pages_tool → list pages` to show all pages
3. Ask user which pages need CMS backing (or "all")
4. Use `element_snapshot_tool` to get the element tree for each selected page

### Scaffold Step 2: Analyze Page Structure

Examine the element tree and identify content patterns:
- Group elements by section (using class name prefixes like `hero_`,
  `features_`, `testimonials_`)
- For each group, hypothesize:
  - Whether it should be a CMS collection or stay static
  - What fields are needed (Title, Description, Image, Button Text, Button URL)
  - The field type (PlainText, RichText, Image, Link)
  - The collection type (📄 page, 🖼️ rich content, 📦 plaintext)

### Scaffold Step 3: Propose Collection Structure

Present a structured proposal:

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

### Scaffold Step 4: Collaborative Refinement

- User modifies the proposal (rename fields, change types, add/remove)
- Apply section-prefix conventions automatically
- Always include `SEO - Meta Title` and `SEO - Meta Description` on page-type
  collections
- Continue refining until user approves

### Scaffold Step 5: Create Collection

1. Call `data_cms_tool → create_collection` with approved name (including emoji)
2. Call `data_cms_tool → create_collection_static_field` for each field
3. Report: "Created collection '📄 Case Studies' with N fields"
4. Remind: "Collection ready. Run `/upload-copy <file>` when copy is available."

---

## Supported Input Formats

| Format | Detection | Page Source | Label Source |
|--------|-----------|-------------|-------------|
| .xlsx 2-col | "Section" + "Content" headers | Sheet name | Column A |
| .xlsx 3-col | "Word Count" in header | Sheet name | Column A |
| .csv | File extension | Filename | First column |
| .docx | File extension | Filename | Heading styles |
| Google Sheets | URL pattern | Sheet name | First column |
| Folder | Directory | Per-file rules | Per-file rules |

## Important Notes

- The parsing script outputs JSON to stdout and diagnostics to stderr. Read
  stdout for data, stderr for progress messages.
- Element IDs from `element_snapshot_tool` are session-scoped. If Designer
  reconnects between snapshot and apply, re-snapshot before applying.
- RichText containers cannot be updated via MCP — always flag these for manual
  update in Designer.
- CMS items are created as drafts by default. A separate publish step is needed.
- For large batches (100+ elements), log progress every 5 items so the user
  knows work is progressing.
