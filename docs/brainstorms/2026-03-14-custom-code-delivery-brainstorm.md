# Custom Code Delivery Workflow

**Date:** 2026-03-14
**Status:** Brainstorm complete

## What We're Building

A standardized workflow for managing and delivering custom JavaScript to Webflow sites. All custom JS lives in this repository, is served via jsDelivr CDN (from GitHub release tags), and is injected into Webflow pages using the MCP's `data_scripts_tool`.

## Why This Approach

### Always jsDelivr (no inline scripts)
- Inline scripts via Webflow MCP don't create local files — there's no way to view, edit, or version them outside the Webflow dashboard
- jsDelivr is the pattern the team is already familiar with
- Every script has a local file in the repo for code review, editing, and version control
- Rollback is straightforward via git tags

### Single repository
- All project assets (components, scripts, automation) live in one place
- No need to manage a separate JS repo
- jsDelivr works with any public GitHub repo — just tag releases

## Key Decisions

1. **Delivery method:** Always jsDelivr, never Webflow inline scripts
2. **Script location:** `scripts/` directory in this repo (co-located with everything else)
3. **Versioning:** Semver release tags (e.g., `v1.0.0`) — jsDelivr URLs pin to a specific tag for cache control
4. **Injection method:** Webflow MCP's `data_scripts_tool` adds `<script src="cdn.jsdelivr.net/gh/...@tag/scripts/...">` tags to pages
5. **Script types covered:** GSAP animations, analytics/tracking, custom interactions (nav, scroll, buttons)
6. **Script organization:** Modular per-component + global scripts (see below)
7. **GSAP loading:** Via Webflow's built-in GSAP CDN toggle (not bundled)
8. **Dev workflow:** Local server first, then tag for production via jsDelivr

## Workflow

### Script organization

**Modular approach** — now that the MCP can inject per-page script tags, scripts are organized per-component rather than monolithic:

```
scripts/
  global/           # Loaded site-wide via project settings
    analytics.js
    nav.js
  components/       # Loaded per-page where the component exists
    two-img-imba.js
    hero-split.js
    testimonial-carousel.js
```

- **Global scripts** (`scripts/global/`) — loaded on every page. Includes analytics, nav, and **shared animations/behaviors that apply across multiple components** (e.g., a general scroll-reveal triggered by `data-animation-general`, common fade-in patterns)
- **Component scripts** (`scripts/components/`) — loaded only on pages where that component is used. For logic **unique to one specific component** (e.g., a custom carousel, a specific interactive element)
- **Decision rule:** If more than one component uses the same animation/behavior → global script. If unique to one component → component script.
- Each component script is self-contained — no conditional DOM checks needed since it's only loaded where relevant
- The build pipeline maintains a **component-to-script mapping** so the automation knows which script to inject when placing a component

### Writing scripts
1. Create/edit JS files in `scripts/` (global or components subdirectory)
2. Component scripts should be self-contained — they can assume their component exists on the page
3. GSAP is available globally (loaded via Webflow's CDN toggle) — scripts just use `gsap.*` directly
4. Commit and push to GitHub

### Releasing scripts
1. Tag the release: `git tag v1.0.0 && git push --tags`
2. jsDelivr URL pattern: `https://cdn.jsdelivr.net/gh/{user}/{repo}@{tag}/scripts/{file}.js`
3. Purge jsDelivr cache if needed: `https://purge.jsdelivr.net/gh/{user}/{repo}@{tag}/scripts/{file}.js`

### Injecting into Webflow
1. Use `data_scripts_tool` via MCP to add the `<script>` tag to the target page
2. Script tags reference the tagged jsDelivr URL
3. Publish the site after injection

### Updating scripts
1. Edit the local file in `scripts/`
2. Create a new release tag
3. Update the jsDelivr URL in Webflow (bump the tag version)
4. Republish

### Dev testing
1. Run a local dev server to test scripts against the published Webflow page
2. Once validated locally, commit and tag a release
3. Update jsDelivr URLs in Webflow to point at the new tag
4. Republish

## Integration with Build Pipeline

The `build-component` skill's Phase 4 currently references `/custom-code-management` — this workflow formalizes what that skill should do:

1. After component HTML structure is built, check if the component needs custom JS (animations, interactions)
2. Write the JS file to `scripts/components/{component-name}.js`
3. Tag a release (or use existing tag if bundling multiple changes)
4. Use `data_scripts_tool` to inject the jsDelivr `<script>` tag on the target page
5. The script handles GSAP animations, scroll triggers, etc. that the MCP can't automate

### Component-to-script mapping
The automation needs a registry that maps component names to their script files. When placing a component on a page, the pipeline:
1. Looks up the component in the registry
2. If a script exists, injects the jsDelivr `<script>` tag on that page
3. Also ensures global scripts are loaded site-wide

This registry could be a simple JSON file (e.g., `scripts/manifest.json`) or derived from the directory structure.

## Resolved Questions

1. **Script organization:** Modular per-component approach. Component scripts live in `scripts/components/`, global scripts in `scripts/global/`. No conditional DOM checks needed since scripts are only loaded on pages where the component exists.
2. **GSAP loading:** Via Webflow's built-in GSAP CDN toggle — not bundled into project scripts. Component scripts assume `gsap` is globally available.
3. **Dev vs prod workflow:** Local server first for testing, then tag a release for production delivery via jsDelivr.
