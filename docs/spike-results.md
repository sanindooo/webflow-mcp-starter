# Spike Results

## data_scripts_tool

**Date:** 2026-03-14
**Site:** MCP Test (`69b54b480e154ad5f39ace4a`)

### API Surface

The tool has 6 actions:

| Action | Purpose |
|---|---|
| `add_inline_site_script` | Register an inline script (sourceCode, max 2000 chars) |
| `list_registered_scripts` | List all registered scripts for a site |
| `list_applied_scripts` | List scripts applied to a site (404 if none) |
| `get_page_script` | Get scripts applied to a specific page |
| `upsert_page_script` | Apply registered scripts to a page (by script ID) |
| `delete_all_site_scripts` | Delete all scripts from a site |
| `delete_all_page_scripts` | Delete all scripts from a page |

### Key Findings

#### 1. Inline only — no external URL support

`add_inline_site_script` accepts a `sourceCode` string (inline JS, max 2000 chars). There is **no action for registering an external `<script src="...">` tag**. Webflow hosts the inline code on its own CDN (`cdn.prod.website-files.com`).

**Workaround:** Use a **loader stub** — a small inline script (~150 chars) that dynamically creates a `<script>` element pointing to jsDelivr:

```javascript
(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/user/repo@tag/scripts/file.js';s.defer=true;document.head.appendChild(s);})()
```

This was tested and confirmed working on the live site.

#### 2. Two-step workflow: register then apply

Scripts must be **registered** first (returns an `id`), then **applied** to pages or the site using that `id`. You cannot inject a script in a single call.

1. `add_inline_site_script` → returns `{ id: "script_name", ... }`
2. `upsert_page_script` → applies by `id` to a specific page

#### 3. upsert_page_script IS DESTRUCTIVE (replaces all)

**Confirmed:** `upsert_page_script` replaces ALL existing scripts on the page with the provided array. If you send only one script, any previously applied scripts are removed.

**Mandatory pattern:** Read-merge-write:
1. `get_page_script` → read existing scripts
2. Merge new script into the existing array
3. `upsert_page_script` → write full combined set

#### 4. Site-level vs page-level are independent

Scripts applied at the site level (via `list_applied_scripts`) persist independently from page-level scripts. Removing a script from a page does NOT remove it from the site-level application. Both appeared in the published HTML.

#### 5. Registration fields

| Field | Required | Notes |
|---|---|---|
| `sourceCode` | Yes | Inline JS, max 2000 chars |
| `version` | Yes | Semver string (e.g., "0.1.0") |
| `displayName` | Yes | 1-50 alphanumeric chars, becomes the script ID (slugified) |
| `location` | No | "header" or "footer" (default varies) |
| `canCopy` | No | Whether script copies on site duplication |
| `attributes` | No | Key/value pairs applied as script element attributes |

The `displayName` gets slugified to become the script's `id` (e.g., "jsDelivr Loader Test" → `jsdelivr_loader_test`).

#### 6. Delete endpoints return 404 when no custom code block exists

Both `delete_all_page_scripts` and `delete_all_site_scripts` return 404 with "Custom code block not found" if no scripts are currently applied. Not a real error — just means nothing to delete.

#### 7. Attributes on registration vs application

The `attributes` field is available at both registration time (`add_inline_site_script.request.attributes`) and application time (`upsert_page_script.scripts[].attributes`). This could potentially be used to add `integrity` and `crossorigin` attributes to the hosted script tag — though SRI on an inline-hosted script is redundant since Webflow controls the CDN.

### Impact on Custom Code Delivery Workflow

The original plan assumed `data_scripts_tool` could inject external `<script src>` tags. It cannot. The revised approach:

1. **Loader stub pattern:** Register a small inline script (~150 chars) that dynamically creates a `<script>` element pointing to jsDelivr. Well under the 2000-char limit.
2. **One loader per script:** Each jsDelivr script gets its own loader stub registered in Webflow.
3. **SRI on the loader:** The loader itself is hosted by Webflow (trusted CDN). SRI should be applied to the dynamically created `<script>` element instead — the loader sets `s.integrity` and `s.crossOrigin`.
4. **Read-merge-write is mandatory:** Every `upsert_page_script` call must first read existing scripts to avoid data loss.

### Updated Loader Stub Template (with SRI)

```javascript
(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}';s.integrity='{integrity}';s.crossOrigin='anonymous';s.defer=true;document.head.appendChild(s);})()
```

This is ~220 chars with a typical SHA-384 hash — safely under the 2000-char limit.
