# Custom Code Delivery Reference

All custom JavaScript for Webflow sites lives in this repository under `scripts/`, is served via jsDelivr CDN from GitHub release tags, and is injected into Webflow pages using the MCP's `data_scripts_tool`.

## Directory Structure

```
scripts/
  manifest.json           # Component-to-script registry (version, URLs, mappings)
  global/                 # Loaded site-wide via Webflow Project Settings
    animations.js          # Shared scroll-reveal, fade-in (GSAP ScrollTrigger)
    analytics.js           # GA4, tracking pixels
    nav.js                 # Navigation behavior
  components/             # Loaded per-page where the component exists
    two-img-imba.js        # Component-specific interactions
    hero-split.js
```

## Decision Rule

- **Global:** Behavior shared across multiple components (e.g., general scroll-reveal via `data-animation-general`)
- **Component:** Logic unique to one specific component (e.g., a custom carousel)

## manifest.json

The manifest is the single source of truth for the component-to-script mapping:

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

### Fields

| Field | Description |
|---|---|
| `version` | Current semver tag. All jsDelivr URLs use this tag. |
| `jsdelivr.user` | GitHub username or org |
| `jsdelivr.repo` | GitHub repository name |
| `global[].name` | Human-readable script name |
| `global[].path` | Path relative to repo root |
| `global[].description` | What the script does |
| `global[].attributes` | Script tag attributes (`defer`, `async`, etc.) |
| `components.{name}` | Component name (must match build pipeline naming) |
| `components.{name}.path` | Path relative to repo root |

## jsDelivr URL Formula

```
https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}
```

Example:
```
https://cdn.jsdelivr.net/gh/sanindooo/webflow-mcp-test@v0.1.0/scripts/global/animations.js
```

## Workflow

### Creating a new script

1. Determine scope: global or component-specific
2. Create the JS file in the appropriate directory
3. Update `scripts/manifest.json` with the new entry
4. Commit and push to GitHub
5. Create a new release tag:
   ```bash
   git tag v0.2.0
   git push --tags
   ```
6. Update the `version` field in `manifest.json` to match the new tag
7. Inject the script tag into Webflow via `/custom-code-management` skill
8. Publish the Webflow site

### Updating an existing script

1. Edit the JS file locally
2. Commit and push
3. Create a new tag (bump version)
4. Update `version` in `manifest.json`
5. Update the jsDelivr URL in Webflow (bump the tag in the script `src`)
6. Republish

### Rolling back

1. Change the jsDelivr URL in Webflow back to a previous tag (e.g., `@v0.1.0`)
2. Republish
3. No code changes needed — the old tag still exists

### Cache purging

If jsDelivr serves stale content after a new tag:
```
https://purge.jsdelivr.net/gh/{user}/{repo}@{tag}/{path}
```

Visit this URL in a browser or `curl` it to force-refresh.

## Script Conventions

### Template

```javascript
/**
 * Script Name
 *
 * Description of what this script does.
 * Loaded on: [site-wide | specific pages]
 * Dependencies: GSAP (via Webflow CDN toggle)
 */
;(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', function () {
    // Script logic here
    // GSAP is available globally: gsap.to(), gsap.from(), etc.
    // ScrollTrigger: gsap.registerPlugin(ScrollTrigger)
  })
})()
```

### Rules

- Wrap in IIFE to avoid polluting global scope
- Use `'use strict'`
- GSAP is loaded via Webflow's CDN toggle — use `gsap.*` directly
- Component scripts can assume their component exists on the page (only loaded where relevant)
- No API keys or secrets (public repo)
- No `eval()` or `document.write()`
- All scripts use `defer` attribute for non-blocking loading

### Loading order

1. GSAP (Webflow CDN toggle, injected in `<head>`)
2. Global scripts (Webflow Project Settings, site-wide)
3. Component scripts (page-level custom code)

All custom scripts use `defer`, so they execute after DOM parsing and in document order.

## Dev Testing

### Local server

```bash
pnpm dev
```

Starts `http-server` serving `scripts/` on `http://localhost:3000` with CORS enabled and caching disabled.

### Redirecting jsDelivr to localhost

Use a browser extension to redirect jsDelivr URLs to your local server during development:

**Resource Override** (Chrome):
1. Install from Chrome Web Store
2. Add rule: `https://cdn.jsdelivr.net/gh/sanindooo/webflow-mcp-test@*/*` → `http://localhost:3000/$2`

**Requestly** (Chrome/Firefox):
1. Install from extension store
2. Create redirect rule with the same pattern

This lets you test script changes instantly against the live Webflow page without tagging releases.

### Pre-release tags (alternative)

If you prefer not to use a browser extension:
1. Tag a pre-release: `git tag v0.2.0-beta.1 && git push --tags`
2. Temporarily update the Webflow script URL to use the beta tag
3. Test on the published site
4. When satisfied, create the final tag and update the URL

## Pipeline Integration

The `/custom-code-management` skill is invoked by `build-component` Phase 4.4 when a component needs custom JS. The flow:

1. Build pipeline places component on page
2. Reads `scripts/manifest.json` to check for associated script
3. If script found → injects jsDelivr `<script>` tag via `data_scripts_tool`
4. If new script needed → creates the file, updates manifest, injects
5. Ensures global scripts are present at the project level

## Prerequisites

- **Public GitHub repo** — jsDelivr requires public repos to serve files
- **GSAP enabled** — Toggle on Webflow's built-in GSAP CDN in site settings
- **data_scripts_tool spike** — The MCP tool's additive vs. replacement behavior needs to be tested (see Phase 0 in the plan)
