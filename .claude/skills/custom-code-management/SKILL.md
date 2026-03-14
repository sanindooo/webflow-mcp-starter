---
name: custom-code-management
description: >
  Manages custom JavaScript delivery for Webflow sites via jsDelivr CDN.
  Reads the component-to-script manifest, writes JS files, constructs jsDelivr
  URLs, and injects script tags into Webflow pages using data_scripts_tool.
  Use when a component needs custom JS (animations, interactions, analytics)
  or when managing scripts on a Webflow site. Triggers on "add custom script",
  "inject script", "custom code", or when build-component detects a component
  needs JS.
allowed-tools:
  - mcp__webflow__data_scripts_tool
  - mcp__webflow__data_sites_tool
  - mcp__webflow__data_pages_tool
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Custom Code Management

You manage custom JavaScript delivery for Webflow sites. All scripts live in
this repository under `scripts/`, are served via jsDelivr CDN from GitHub
release tags, and are injected into Webflow pages using the MCP's
`data_scripts_tool`.

## Key Principle

**Always jsDelivr, never inline scripts.** Every script must exist as a local
file in `scripts/` for version control, code review, and rollback. The MCP
only injects `<script src>` tags pointing to jsDelivr URLs — never inline code.

## Reference Files

Read these before operating:
- `scripts/manifest.json` — component-to-script registry
- `CLAUDE.md` — project conventions
- `docs/reference/custom-code.md` — full workflow documentation

## Manifest Schema

The manifest at `scripts/manifest.json` maps components to their scripts:

```json
{
  "version": "v0.1.0",
  "jsdelivr": {
    "user": "sanindooo",
    "repo": "webflow-mcp-test"
  },
  "global": [
    {
      "name": "animations",
      "path": "scripts/global/animations.js",
      "description": "Shared scroll-reveal and fade-in animations",
      "attributes": { "defer": true }
    }
  ],
  "components": {
    "component-name": {
      "path": "scripts/components/component-name.js",
      "description": "What this script does",
      "attributes": { "defer": true }
    }
  }
}
```

**jsDelivr URL formula:**
```
https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}
```

## Operations

### 1. Look Up Script for Component

When the build pipeline places a component, check if it has a script:

1. Read `scripts/manifest.json`
2. Look up the component name in `components`
3. If found → proceed to inject (Operation 3)
4. If not found → no script needed, skip

### 2. Create New Script

When a component needs custom JS that doesn't exist yet:

1. **Determine scope:**
   - If the behavior is unique to one component → `scripts/components/{name}.js`
   - If shared across multiple components → `scripts/global/{name}.js`

2. **Write the script file:**
   - Wrap in an IIFE to avoid polluting global scope
   - Use `'use strict'`
   - Assume GSAP is globally available (loaded via Webflow CDN toggle)
   - Component scripts can assume their component exists on the page
   - Do NOT use `eval()` or `document.write()`
   - No API keys or secrets (this is a public repo)

   ```javascript
   ;(function () {
     'use strict'

     document.addEventListener('DOMContentLoaded', function () {
       // Component-specific logic here
     })
   })()
   ```

3. **Update manifest.json:**
   - Add entry to `components` (or `global` array)
   - Include `path`, `description`, and `attributes`

4. **Inform the user** that they need to:
   - Commit and push the changes
   - Create a new git tag: `git tag v{version} && git push --tags`
   - Update the `version` field in manifest.json to match the new tag

### 3. Inject Script into Webflow Page

Inject a `<script>` tag pointing to jsDelivr for a specific component or global script:

1. **Read manifest.json** to get the script path and version
2. **Construct the jsDelivr URL:**
   ```
   https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}
   ```
3. **Build the script tag:**
   ```html
   <script src="https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}" defer></script>
   ```
4. **Check for existing scripts** on the target page using `data_scripts_tool`
   - If the script is already injected, skip (avoid duplicates)
5. **Inject via `data_scripts_tool`:**
   - Component scripts → page-level custom code on the target page
   - Global scripts → project-level custom code (site-wide)

### 4. Ensure Global Scripts Are Present

When building any component, verify global scripts are loaded site-wide:

1. Read `manifest.json` → `global` array
2. For each global script, check if it's already in the site's project-level scripts
3. If missing, inject via `data_scripts_tool` at the project level

### 5. Update Existing Script

When modifying a script that's already deployed:

1. Edit the local file in `scripts/`
2. Inform the user to:
   - Commit and push
   - Create a new tag (bump version)
   - Update `version` in manifest.json
3. Update the jsDelivr URL in Webflow (bump the tag in the script src)
4. Purge jsDelivr cache if needed:
   ```
   https://purge.jsdelivr.net/gh/{user}/{repo}@{version}/{path}
   ```

### 6. Remove Script

When a component no longer needs custom JS:

1. Remove the entry from `manifest.json`
2. Remove the `<script>` tag from the Webflow page via `data_scripts_tool`
3. Optionally delete the JS file (or keep for history)

## Script Conventions

### File structure
- **Global scripts:** `scripts/global/{name}.js`
- **Component scripts:** `scripts/components/{component-name}.js`
- Component script names must match the component name in manifest.json

### Code style
- Wrap in IIFE: `;(function () { ... })()`
- Use `'use strict'`
- Use `document.addEventListener('DOMContentLoaded', ...)` for DOM-dependent code
- GSAP is globally available — use `gsap.*` directly
- Use `var` or `const`/`let` depending on browser support requirements
- Add a file-level JSDoc comment explaining the script's purpose

### Loading
- All scripts use `defer` attribute by default
- Global scripts load before component scripts (injected at project level)
- GSAP loads before all custom scripts (Webflow injects it in `<head>`)

## Integration with Build Pipeline

This skill is invoked by `build-component` Phase 4.4 when custom scripts are needed.

**Inputs from build pipeline:**
- Component name (to look up in manifest)
- Target Webflow page (to inject script tag)
- Whether the component needs new JS or uses an existing script

**Outputs back to build pipeline:**
- Whether injection succeeded
- The jsDelivr URL(s) that were injected
- Any errors or warnings

## Important Notes

- **jsDelivr requires a public GitHub repo.** Verify the repo is public before testing URLs.
- **Propagation delay:** After pushing a new tag, jsDelivr may take a few minutes to serve the new content. Verify the URL returns 200 before publishing the Webflow site.
- **Cache purge:** Use `https://purge.jsdelivr.net/gh/{user}/{repo}@{tag}/{path}` to force-refresh.
- **data_scripts_tool spike required:** Phase 0 of the plan (spike) must be completed to understand additive vs. replacement behavior of the tool. Until then, always read existing scripts before writing to avoid overwriting.
