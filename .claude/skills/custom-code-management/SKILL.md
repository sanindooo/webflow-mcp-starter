---
name: custom-code-management
description: >
  Manages custom JavaScript delivery for Webflow sites via jsDelivr CDN.
  Reads the component-to-script manifest, writes JS files, constructs jsDelivr
  URLs, and injects script tags into Webflow pages using data_scripts_tool.
  Triggers on "add custom script", "inject script", "custom code", or when
  build-component detects a component needs JS.
allowed-tools:
  - mcp__webflow__data_scripts_tool
  - mcp__webflow__data_sites_tool
  - mcp__webflow__data_pages_tool
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - "Bash(curl:*)"
  - "Bash(shasum:*)"
  - "Bash(openssl:*)"
  - "Bash(base64:*)"
---

# Custom Code Management

You manage custom JavaScript delivery for Webflow sites. All scripts live in
`scripts/`, are served via jsDelivr CDN from GitHub release tags, and are
injected into Webflow pages using `data_scripts_tool`.

## CRITICAL: Pre-flight Checks

**Before ANY injection operation, verify BOTH of these:**

1. **Spike completed?** Check if `docs/spike-results.md` has a `## data_scripts_tool`
   section. If NOT found, **STOP** and tell the user:
   > "The data_scripts_tool spike has not been completed. The tool's behavior
   > (append vs replace, inline vs external URL support) is unknown. Run the
   > spike first — see Phase 0 in the plan."

2. **Read before write.** The `upsert_page_script` action **replaces ALL existing
   scripts** on a page. You MUST:
   - Read existing page scripts first (`get_page_script`)
   - Merge the new script into the existing array
   - Write the full combined set back via `upsert_page_script`
   - **Never call upsert without reading first — this causes silent data loss.**

## Key Principle

**Always jsDelivr, never inline scripts.** Every script exists as a local file
in `scripts/` for version control and rollback.

## Reference

- `scripts/manifest.json` — the single source of truth for script registry
- `CLAUDE.md` — project conventions

## jsDelivr URL Formula

```
https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}
```

Read `jsdelivr.user`, `jsdelivr.repo`, and `version` from `scripts/manifest.json`.

## Operations

### 1. Look Up Script for Component

1. Read `scripts/manifest.json`
2. Look up the component name in `components`
3. If found → proceed to inject (Operation 3)
4. If not found → no script needed, skip

### 2. Create New Script

1. **Determine scope:**
   - Unique to one component → `scripts/components/{name}.js`
   - Shared across multiple components → `scripts/global/{name}.js`

2. **Write the script file** using this template:

   ```javascript
   /**
    * Script Name
    *
    * What this script does.
    * Dependencies: GSAP (via Webflow CDN toggle)
    */
   ;(function () {
     'use strict'

     document.addEventListener('DOMContentLoaded', function () {
       // Logic here. GSAP is available globally: gsap.to(), gsap.from(), etc.
     })
   })()
   ```

   Rules: IIFE wrapper, `'use strict'`, no `eval()`/`document.write()`, no secrets.

3. **Generate SRI hash:**
   ```bash
   openssl dgst -sha384 -binary scripts/{path}.js | openssl base64 -A
   ```

4. **Update `scripts/manifest.json`** — add entry with `path`, `description`, and `integrity`:
   ```json
   {
     "path": "scripts/components/example.js",
     "description": "What it does",
     "integrity": "sha384-{hash from step 3}"
   }
   ```

5. **Update version** in manifest.json to the tag you will create (e.g., bump `v0.1.0` → `v0.2.0`).

6. **Inform user** to commit, push, and tag:
   ```bash
   git add scripts/ && git commit -m "feat: add {name} script"
   git tag v{new_version} && git push && git push --tags
   ```

### 3. Inject Script into Webflow Page

**Pre-flight:** Run the checks at the top of this document first.

1. Read `scripts/manifest.json` for path, version, and integrity
2. Construct the jsDelivr URL
3. **Verify the URL is live** before injecting:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" "https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}"
   ```
   If not 200, wait and retry (jsDelivr may need time to pick up a new tag).
4. Build the script tag:
   ```html
   <script src="{url}" integrity="{integrity}" crossorigin="anonymous" defer></script>
   ```
5. **Read existing scripts** on the target page via `data_scripts_tool` (`get_page_script`)
6. **Merge** the new script into the existing list (avoid duplicates by checking src URL)
7. **Write** the full combined set via `data_scripts_tool` (`upsert_page_script`)
   - Component scripts → page-level
   - Global scripts → project-level (site-wide)

## Script Conventions

- **Global:** `scripts/global/{name}.js` — loaded site-wide
- **Component:** `scripts/components/{component-name}.js` — loaded per-page
- Component script filenames must match the component name in manifest.json
- GSAP is globally available (Webflow CDN toggle) — use `gsap.*` directly
- All scripts use `defer` — executes after DOM parsing, in document order
- Loading order: GSAP (head) → global scripts (project-level) → component scripts (page-level)

## Cache Purging

If jsDelivr serves stale content after a new tag:
```
https://purge.jsdelivr.net/gh/{user}/{repo}@{tag}/{path}
```
Visit or `curl` this URL to force-refresh.

## Important Notes

- **jsDelivr requires a public GitHub repo.** Verify the repo is public before testing URLs.
- **Propagation delay:** After pushing a new tag, jsDelivr may take a few minutes. Always verify the URL returns 200 before injecting into Webflow.
- **SRI is mandatory.** Every script tag must include `integrity` and `crossorigin="anonymous"`. Generate the hash at release time and store in the manifest.
