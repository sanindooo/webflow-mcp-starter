---
title: "feat: Custom Code Delivery Workflow"
type: feat
status: active
date: 2026-03-14
brainstorm: docs/brainstorms/2026-03-14-custom-code-delivery-brainstorm.md
---

# feat: Custom Code Delivery Workflow

## Overview

Establish a standardized workflow for managing and delivering custom JavaScript to Webflow sites. All JS lives in `scripts/` in this repo, is served via jsDelivr CDN from GitHub release tags, and is injected into Webflow pages using the MCP's `data_scripts_tool`. This also creates the `/custom-code-management` skill referenced (but not yet implemented) in the build-component pipeline.

## Problem Statement / Motivation

The build-component skill references `/custom-code-management` in Phase 4.4 but the skill doesn't exist. There is no defined workflow for how custom scripts (GSAP animations, analytics, custom interactions) get from development to the live Webflow site. The team uses jsDelivr but the process is undocumented and unautomated.

## Proposed Solution

### Architecture

```
scripts/
  manifest.json           # Component-to-script mapping registry
  global/                 # Loaded site-wide (project settings)
    animations.js          # Shared scroll-reveal, fade-in patterns
    analytics.js           # GA4, tracking pixels
    nav.js                 # Navigation behavior
  components/             # Loaded per-page where component exists
    two-img-imba.js
    hero-split.js
    testimonial-carousel.js
```

**Delivery chain:** Local file → git commit → semver tag → jsDelivr CDN → loader stub registered via `data_scripts_tool` (inline, ~220 chars) → applied to page → Webflow publish

**Note:** `data_scripts_tool` only supports inline scripts (max 2000 chars), not external `<script src>` tags. The workaround is a loader stub that dynamically creates a `<script>` element pointing to jsDelivr with SRI. See `docs/spike-results.md`.

**GSAP dependency:** Loaded via Webflow's built-in CDN toggle. Not bundled. All scripts can assume `gsap` is globally available.

### manifest.json Schema

```json
{
  "version": "v1.0.0",
  "jsdelivr": {
    "user": "sanindooo",
    "repo": "webflow-mcp-test"
  },
  "global": [
    {
      "name": "animations",
      "path": "scripts/global/animations.js",
      "description": "Shared scroll-reveal and fade-in animations",
      "integrity": "sha384-{hash}"
    }
  ],
  "components": {
    "two-img-imba": {
      "path": "scripts/components/two-img-imba.js",
      "description": "Image parallax effect unique to this component",
      "integrity": "sha384-{hash}"
    }
  }
}
```

- `version` — current semver tag; all jsDelivr URLs use this tag
- `global` — array of scripts injected site-wide via Webflow Project Settings
- `components` — map of component name → script metadata; injected per-page
- `integrity` — SRI hash (sha384) for subresource integrity verification

**Resolved URL formula:** `https://cdn.jsdelivr.net/gh/{user}/{repo}@{version}/{path}`

### Script loading strategy

- All custom scripts use `defer` — this guarantees they execute after DOM parsing and in document order
- Webflow's GSAP toggle loads GSAP before custom scripts (it injects in `<head>`)
- Global scripts are injected via Webflow Project Settings (site-wide `<head>` or before `</body>`)
- Component scripts are injected via page-level custom code

## Implementation Phases

### Phase 0: Spike — data_scripts_tool Discovery

Before building anything, test the MCP tool to understand its actual behavior.

- [x] Fetch `data_scripts_tool` schema and document parameters
- [x] Test: does it append to existing scripts or replace them? **REPLACES ALL — read-merge-write mandatory**
- [x] Test: can it target project-level (site-wide) vs page-level scripts? **Yes, independently**
- [x] Test: can it list/read existing scripts on a page? **Yes, via get_page_script**
- [x] Test: can it remove a script tag? **delete_all_page_scripts / delete_all_site_scripts (404 if empty)**
- [x] Test: character limit behavior — **inline only, no external URLs. Workaround: loader stub (~220 chars)**
- [x] Document results in `docs/spike-results.md` under a new `## data_scripts_tool` section

**Blocking:** All subsequent phases depend on this. If the tool replaces rather than appends, the injection logic must read-merge-write.

### Phase 1: Directory Structure and Manifest

- [x] Create `scripts/global/` directory with a placeholder `animations.js`
- [x] Create `scripts/components/` directory with a placeholder example
- [x] Create `scripts/manifest.json` with the schema above and placeholder entries
- [x] Add `dev` script to `package.json` for local serving (see Phase 3)

### Phase 2: `/custom-code-management` Skill

Create `.claude/skills/custom-code-management/SKILL.md` — the skill referenced by build-component Phase 4.4.

**Skill responsibilities:**
- [x] Read `scripts/manifest.json` to look up component-to-script mappings
- [x] Write new JS files to `scripts/components/` or `scripts/global/`
- [x] Construct jsDelivr URLs from manifest metadata
- [x] Inject `<script>` tags via `data_scripts_tool` (page-level for components, project-level for globals)
- [x] Handle the "already injected" case — check for existing script tags before adding duplicates
- [x] Update `manifest.json` when adding new scripts

**Skill inputs:**
- Component name (to look up in manifest)
- OR explicit script path + target page (for manual injection)

**Skill does NOT handle:**
- Git tagging (done manually or via a separate release step)
- Local dev server (separate concern)

### Phase 3: Local Dev Server

- [x] Add `http-server` (or similar) as a devDependency
- [x] Add `"dev": "npx http-server scripts/ -p 3000 --cors"` to `package.json`
- [x] Document the dev testing workflow: use a browser extension (e.g., Resource Override, Requestly) to redirect jsDelivr URLs to `http://localhost:3000/` during development
- [x] Alternative: use pre-release tags (`v1.0.0-beta.1`) for testing without local server

### Phase 4: Build Pipeline Integration

Update `.claude/skills/build-component/SKILL.md` to integrate with the custom code workflow:

- [x] In Phase 4.4 "Decision Points", replace the stub `/custom-code-management` reference with concrete steps
- [x] Add `Read` permission for `scripts/manifest.json`
- [x] Add `Write` permission for `scripts/**` paths
- [x] After component build, check manifest for associated script
- [x] If script exists: inject via `data_scripts_tool`
- [x] If no script: skip (most components won't need custom JS)
- [x] Ensure global scripts are present at the project level (idempotent check)

### Phase 5: Versioning and Release Workflow

- [ ] Create first git tag: `git tag v0.1.0`
- [ ] Add `"release"` script to `package.json`: `git tag $1 && git push --tags`
- [ ] Document the tagging workflow in a reference doc
- [ ] Add jsDelivr propagation check: verify URL returns 200 before proceeding to publish
- [ ] Document cache purge URL pattern for troubleshooting

### Phase 6: Documentation

- [x] Update `CLAUDE.md` with custom code delivery section (jsDelivr pattern, manifest.json, script organization)
- [x] Create `docs/reference/custom-code.md` with full workflow documentation
- [x] Update build-component skill docs to reference the new workflow

## Technical Considerations

### Repo visibility
jsDelivr requires a public GitHub repo. This repo is intended to become a public starter template (per project memory), so this is aligned. **Verify the repo is public before testing jsDelivr URLs.**

### jsDelivr propagation timing
After pushing a new tag, jsDelivr may take up to a few minutes to serve the new content. The pipeline should:
1. Push the tag
2. Poll `https://cdn.jsdelivr.net/gh/{user}/{repo}@{tag}/scripts/manifest.json` until it returns 200
3. Only then proceed to Webflow publish

### Script deduplication
When the pipeline registers a loader stub and applies it to a page, it must not create duplicates. Since `upsert_page_script` replaces all scripts, the skill reads existing scripts first, merges, and writes the combined set. Duplicate checking is done by matching script `id` values.

### Error handling
- Scripts should be wrapped in an IIFE to avoid polluting the global scope
- Runtime errors in one component script should not break other scripts
- The `defer` attribute ensures scripts don't block page rendering

### Security
- No API keys or secrets in scripts (this is a public repo)
- SRI (Subresource Integrity) is mandatory — every script tag includes `integrity="sha384-..."` and `crossorigin="anonymous"`. Hashes are stored in `manifest.json` and generated at release time.
- Scripts should not use `eval()` or `document.write()`

## Acceptance Criteria

- [x] `scripts/` directory exists with `global/`, `components/`, and `manifest.json`
- [x] `manifest.json` has a defined schema and at least one example entry
- [x] `/custom-code-management` skill exists and can inject a jsDelivr script tag into a Webflow page
- [x] `build-component` skill Phase 4.4 uses the new skill instead of a stub reference
- [x] `data_scripts_tool` behavior is documented in spike results
- [x] Local dev server can serve scripts for testing
- [ ] At least one git tag exists and jsDelivr successfully serves a script from it *(deferred — requires push + public repo)*
- [x] `CLAUDE.md` documents the custom code workflow

## Dependencies & Risks

| Risk | Impact | Mitigation |
|---|---|---|
| `data_scripts_tool` replaces instead of appends | High — could overwrite existing scripts | **CONFIRMED** — read-merge-write implemented in skill |
| Repo is private | High — jsDelivr returns 404 | Verify visibility before Phase 5 |
| jsDelivr propagation delay | Medium — stale scripts after release | Polling check before publish |
| GSAP toggle disabled | Medium — animation scripts error silently | Pre-flight check in build-component |
| Script loading order issues | Medium — runtime errors | Use `defer` on all scripts; document dependency chain |

## References & Research

### Internal
- Brainstorm: `docs/brainstorms/2026-03-14-custom-code-delivery-brainstorm.md`
- Build-component skill: `.claude/skills/build-component/SKILL.md` (lines 28, 496-498)
- Pipeline plan: `docs/plans/2026-03-12-feat-figma-to-webflow-automation-pipeline-plan.md`
- MCP limits memory: `memory/feedback_webflow_mcp_limits.md`

### External
- jsDelivr GitHub integration: `https://www.jsdelivr.com/github`
- jsDelivr purge API: `https://purge.jsdelivr.net/`
- Webflow custom code docs: Webflow University
