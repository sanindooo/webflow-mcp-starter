---
title: Figma-to-Webflow copy ingestion from mixed document formats
date: 2026-03-15
module: scripts/api/webflow/parse-copy.js
problem_type: integration-issues
tags: [copy-management, document-parsing, format-normalization, cms-scaffolding, webflow-mcp, security-hardening]
related_issues: []
---

# Copy Ingestion from Mixed Document Formats

## Problem

The Figma-to-Webflow pipeline had no way to ingest client copy. Content arrived
in inconsistent formats — Excel (2-col and 3-col), CSV, Word documents, Google
Sheets — organized by page and section with no standard structure. Manually
matching section labels to Webflow elements was tedious, error-prone, and didn't
scale across multi-page sites or translations. CMS collections also needed to be
created before copy arrived, leading to inconsistent field naming across projects.

## Root Cause

No unified parsing layer existed between external document formats and Webflow's
content model. Each project handled copy ingestion ad-hoc, with no format
detection, locale awareness, or security validation on untrusted file inputs.

## Solution

A two-part implementation following the project's established pattern of "core
logic in testable Node.js scripts, thin skill wrappers for discoverability":

### 1. Parsing Script (`scripts/api/webflow/parse-copy.js`)

Normalizes all input formats to a common JSON schema:

```json
{
  "source": "docs/examples/GTFO-Content-Final-Updated.xlsx",
  "pages": [
    {
      "page": "Homepage",
      "locale": null,
      "sections": [
        { "label": "Hero Header", "content": "It's time to GTFO.", "richText": false },
        { "label": "Under Header", "content": "GTFO travel specialists...", "richText": true,
          "richTextHtml": "<p>GTFO travel specialists <strong>tell it like it is</strong>...</p>" }
      ]
    }
  ],
  "skippedFiles": []
}
```

**Format auto-detection:** 2-col xlsx (Section|Content), 3-col xlsx
(Section|WordCount|Content), CSV, DOCX (heading styles → sections), Google
Sheets URLs (fetched as xlsx via export endpoint), and folder batch mode.

**DOCX dual-mode parsing:** Standard mode (headings as labels, body as content)
and flat mode (headings ARE the content, grouped under H1 parents). Flat mode
handles real client files where all copy is written as heading text with no body
paragraphs between them.

**Locale detection:** Filename patterns like `-nl` in
`STIL-TRANSLATION-NL-FINAL.xlsx`. Codes split into unambiguous (nl, fr, es, etc.)
and ambiguous (de, it, no, fi — require "translation"/"locale" context in
filename to avoid false positives on English substrings).

### 2. Skill Definition (`.claude/skills/upload-copy/SKILL.md`)

Two modes:
- **Upload mode:** parse → analyze Webflow → AI match → preview → apply → SEO → report
- **Scaffold mode:** snapshot page elements → hypothesize CMS fields → propose
  collection → refine collaboratively → create

CMS naming conventions enforced in both modes:
- Collection emoji prefixes: 📄 pages, 🖼️ rich content, 📦 plaintext
- Section-prefixed fields: `Hero - Title`, `Content - Body`, `CTA - Button Text`
- Standard SEO fields: `SEO - Meta Title`, `SEO - Meta Description`

### 3. Security Hardening (from code review)

| Threat | Mitigation |
|--------|------------|
| SSRF via Google Sheets redirect | `fetch(url, { redirect: 'error' })` + response size check |
| XLSX formula injection | `{ cellFormula: false, cellNF: false }` on all XLSX reads |
| Path traversal | `path.resolve()` + `process.cwd()` boundary check |
| XSS in richTextHtml | `sanitizeRichTextHtml()` strips script tags, event handlers, javascript: hrefs |
| Zip bomb / large files | 50MB file size limit checked before parsing |
| Directory traversal | Max depth 5, max 200 files, skip symlinks |
| Info disclosure | Source paths relativized in JSON output |

## Key Code Patterns

### Safe XLSX parsing options

```javascript
const XLSX_SAFE_OPTS = { cellFormula: false, cellNF: false }
const workbook = XLSX.readFile(filePath, XLSX_SAFE_OPTS)
```

### Path boundary check

```javascript
const resolved = resolve(input)
const cwd = process.cwd()
if (!resolved.startsWith(cwd)) {
  console.error('[parse-copy] Path must be within the project directory')
  process.exit(1)
}
```

### Error handling — throw, don't exit

Helper functions throw errors; only `main().catch()` calls `process.exit(1)`.
This keeps functions reusable and testable.

```javascript
// In helpers:
throw new Error('Could not extract sheet ID from URL')

// In main:
main().catch(err => {
  console.error(`[parse-copy] Error: ${err.message}`)
  process.exit(1)
})
```

### CSV deduplication via shared workbook parser

CSV is parsed by XLSX (same library), then routed through `parseWorkbookSheets()`
with a page name override — eliminates duplicate row-parsing logic.

```javascript
function parseCsv (filePath) {
  const workbook = XLSX.readFile(filePath, XLSX_SAFE_OPTS)
  const pages = parseWorkbookSheets(workbook, fileLocale)
  if (pages.length > 0) pages[0].page = pageName  // override "Sheet1"
  return { source: filePath, pages, skippedFiles: [] }
}
```

## Prevention Strategies

### For future file-parsing scripts

- [ ] Disable redirect-following on external HTTP requests; use domain allowlist
- [ ] Set `cellFormula: false` (or equivalent) when parsing spreadsheets
- [ ] Sanitize HTML from third-party parsers before writing to output
- [ ] Validate input paths with `path.resolve()` + boundary check
- [ ] Use `throw` in helpers, not `process.exit()` — let callers handle exits
- [ ] Extract shared parsing logic early to avoid copy-paste duplication
- [ ] Use delimiter-anchored regex for short locale codes, not word-boundary `\b`
- [ ] Relativize absolute paths in all output manifests and logs
- [ ] Check file size before parsing (prevent zip bombs / memory exhaustion)
- [ ] Run `pnpm audit` before adding new dependencies

### Lessons learned

1. **Third-party parsers are attack vectors.** mammoth HTML and XLSX formula
   caches must be treated as untrusted input.
2. **Redirect-following is dangerous by default.** Node `fetch()` follows
   redirects silently — always set `redirect: 'error'` for external URLs.
3. **Short locale codes collide with English.** `de`, `it`, `no`, `fi` match
   common substrings. Require explicit context or delimiter patterns.
4. **Dead code hides fast.** mammoth was called twice with the second result
   unused — caught only in code review.
5. **Code duplication hides bugs.** CSV and XLSX had near-identical row loops;
   a fix to one wouldn't propagate to the other.

## Related Documentation

- `docs/brainstorms/2026-03-14-upload-copy-skill-brainstorm.md` — Design decisions and resolved questions
- `docs/plans/2026-03-14-feat-upload-copy-skill-plan.md` — Implementation plan with acceptance criteria
- `docs/solutions/integration-issues/mcp-api-gap-asset-pipeline.md` — Same architectural pattern (script + skill wrapper)
- `.claude/skills/update-seo/SKILL.md` — Chained after copy upload for SEO metadata
- `.claude/skills/asset-metadata/SKILL.md` — Same preview-confirm-apply pattern
- `CLAUDE.md:127-131` — MCP limitations affecting copy upload (RichText, form elements)
