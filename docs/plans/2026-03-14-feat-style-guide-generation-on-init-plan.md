---
title: "feat: Add style guide generation on initialisation"
type: feat
status: superseded
superseded_by: docs/plans/2026-03-14-feat-relume-style-guide-integration-plan.md
date: 2026-03-14
brainstorm: docs/brainstorms/2026-03-14-style-guide-generation-brainstorm.md
---

# feat: Add style guide generation on initialisation

## Overview

Add a new Phase 2.5 to `/build-component` that automatically generates foundational styles, design variables, and a Style Guide page in Webflow before any component is built. This ensures typography, buttons, and colours are consistent from the first element onward — following Client-First conventions.

## Problem Statement / Motivation

Currently, `/build-component` assumes utility styles either exist or creates them ad-hoc per component. This leads to:
- Inconsistent typography if different components define heading styles differently
- No design variables for colours — values are hardcoded per component
- No single source of truth for foundational styles across the site
- Missing the "Style Guide page" that Client-First provides as a living reference

## Proposed Solution

### Phase 2.5: Style Guide Generation

Inserted between Phase 2 (Setup) and Phase 3 (Figma Read) in `/build-component`. Runs automatically, is idempotent, and completes in three ordered steps:

```
Step 1: Create Webflow variables (colours, spacing)
    ↓ (variables must exist before styles can reference them)
Step 2: Create named styles (typography, buttons) referencing variables
    ↓ (styles must exist before page can use them)
Step 3: Create Style Guide page with sample elements
```

**Source priority:**
1. Figma style guide frame (detected by searching for a top-level frame named "Style Guide" in the Figma file)
2. Fallback: `docs/reference/style-guide.md` (default Client-First token set)

**Idempotency rule:** Check by name. If a variable/style/page with that name already exists, skip it — do not overwrite. This means manual customisations in Webflow are preserved.

### Pre-requisite: Spike `variable_tool`

> **This tool has never been tested in the project.** Before implementing Phase 2.5, run a minimal spike to validate:
> 1. Creating a variable collection
> 2. Creating a colour variable and a size variable within it
> 3. Listing existing variables (for idempotency checks)
> 4. Referencing a variable from `style_tool` via `variable_as_value`
> 5. Error responses and batch limits
>
> Document results in `docs/spike-results.md` (append a new section).

## Technical Approach

### Phase 0: Create `docs/reference/style-guide.md` (fallback token source)

This file defines all default values used when no Figma style guide exists.

#### Typography Scale

Derived from `breakpoints.md` h1 values using a ~1.25 major-third ratio:

| Class | `main` | `medium` | `small` | `tiny` | weight | line-height |
|---|---|---|---|---|---|---|
| `heading-style-h1` | 4rem | 3.375rem | 2.75rem | 2.25rem | 700 | 1.1 |
| `heading-style-h2` | 3rem | 2.5rem | 2.125rem | 2.125rem | 700 | 1.2 |
| `heading-style-h3` | 2.5rem | 2.125rem | 1.75rem | 1.75rem | 700 | 1.3 |
| `heading-style-h4` | 2rem | 1.75rem | 1.5rem | 1.5rem | 600 | 1.3 |
| `heading-style-h5` | 1.5rem | 1.25rem | 1.125rem | 1.125rem | 600 | 1.4 |
| `heading-style-h6` | 1.25rem | 1.125rem | 1rem | 1rem | 600 | 1.4 |
| `text-size-large` | 1.25rem | 1.125rem | 1rem | 1rem | 400 | 1.6 |
| `text-size-medium` | 1rem | 1rem | 1rem | 1rem | 400 | 1.6 |
| `text-size-small` | 0.875rem | 0.875rem | 0.875rem | 0.875rem | 400 | 1.6 |
| `text-rich-text` | 1rem | 1rem | 1rem | 1rem | 400 | 1.6 |

Note: 1rem minimum on mobile (prevents iOS auto-zoom).

#### Colour Variables

**Collection name:** `Colors`

| Variable Name | Default Value | Purpose |
|---|---|---|
| `color-primary` | `#1A1A2E` | Primary brand colour |
| `color-secondary` | `#16213E` | Secondary brand colour |
| `color-accent` | `#0F3460` | Accent / CTA colour |
| `color-neutral-900` | `#111111` | Darkest neutral |
| `color-neutral-700` | `#333333` | Dark text |
| `color-neutral-500` | `#666666` | Muted text |
| `color-neutral-300` | `#CCCCCC` | Borders |
| `color-neutral-100` | `#F5F5F5` | Light backgrounds |
| `color-neutral-0` | `#FFFFFF` | White |
| `color-success` | `#22C55E` | Success semantic |
| `color-error` | `#EF4444` | Error semantic |
| `color-warning` | `#F59E0B` | Warning semantic |
| `color-info` | `#3B82F6` | Info semantic |

#### Spacing Variables

**Collection name:** `Spacing`

| Variable Name | `main` | Purpose |
|---|---|---|
| `spacing-xxl` | 128px | Hero sections |
| `spacing-xl` | 80px | Section padding (maps to `padding-section-xl`) |
| `spacing-lg` | 64px | Large gaps |
| `spacing-md` | 40px | Medium gaps |
| `spacing-sm` | 24px | Small gaps |
| `spacing-xs` | 16px | Tight gaps |
| `spacing-xxs` | 8px | Minimal gaps |

Note: Responsive scaling follows `breakpoints.md` percentages (75-80% medium, 50-60% small, 40-50% tiny).

#### Button Styles

| Class | Background | Border | Text Color | Padding | Border-Radius |
|---|---|---|---|---|---|
| `button-primary` | `color-accent` | none | `color-neutral-0` | 12px 24px | 8px |
| `button-secondary` | `color-neutral-100` | 1px solid `color-neutral-300` | `color-neutral-900` | 12px 24px | 8px |
| `button-ghost` | transparent | none | `color-accent` | 12px 24px | 8px |
| `button-outline` | transparent | 1px solid `color-accent` | `color-accent` | 12px 24px | 8px |

**Hover states:** Each button gets a `hover` pseudo with subtle opacity/shade shift.

### Phase 1: Implement Phase 2.5 in `/build-component`

#### Step 2.5.0: Detect existing styles

```
Call style_tool -> get_styles (query: "all", skip_properties: true)
Call variable_tool -> get_variable_collections (query: "all")
Call de_page_tool -> list pages, check for "/style-guide"
```

If all three exist (styles contain `heading-style-h1`, variables contain `Colors` collection, page `/style-guide` exists) → skip Phase 2.5 entirely.

If partial → continue, creating only what's missing.

#### Step 2.5.1: Determine token source

```
IF Figma URL was provided in Phase 1:
  Call get_metadata(fileKey) to list top-level frames
  Search for frame named "Style Guide" (case-insensitive)
  IF found:
    Call get_design_context(fileKey, nodeId) to extract tokens
    Parse: colours, typography scale, button patterns
    Save extracted tokens for use in Steps 2-4
  ELSE:
    Read docs/reference/style-guide.md for fallback values
ELSE:
  Read docs/reference/style-guide.md for fallback values
```

#### Step 2.5.2: Create variables

Order: Collections first, then variables within each collection.

```
1. Create "Colors" collection (if not exists)
2. Create each colour variable (skip if name exists in collection)
3. Create "Spacing" collection (if not exists)
4. Create each spacing variable (skip if name exists in collection)
```

Track returned variable IDs — these are needed for `variable_as_value` in Step 2.5.3.

**Batching:** One `create_color_variable` or `create_size_variable` per call (until spike confirms batch limits).

#### Step 2.5.3: Create styles

Order: Typography first, then buttons.

```
For each heading style (h1-h6):
  1. create_style with name, main breakpoint properties (font-size, line-height, font-weight)
     Use variable_as_value for color property if variable IDs available
  2. update_style at "medium" breakpoint (font-size override only)
  3. update_style at "small" breakpoint
  4. update_style at "tiny" breakpoint

For text styles (text-size-large, text-size-medium, text-size-small, text-rich-text):
  Same pattern but fewer breakpoint overrides (most stay at 1rem)

For button styles (button-primary, button-secondary, button-ghost, button-outline):
  1. create_style with name, noPseudo properties
  2. update_style with pseudo: "hover" properties
```

**Estimated calls:** ~6 headings x 4 = 24, ~4 text x 2 = 8, ~4 buttons x 2 = 8 → ~40 style_tool calls.

#### Step 2.5.4: Create Style Guide page

```
1. Call de_page_tool -> create page:
   - title: "Style Guide"
   - slug: "style-guide"
   - excludeFromSitemap: true (if supported, otherwise set via meta tag)
   - Draft/hidden from nav

2. Build page structure via element_builder (sequential, max 3 levels per call):

   Call 1: Page body wrapper
   <section> sg_section + padding-global
     <div> container-xl
       <article> sg_component

   Call 2: Colours section
   Parent: sg_component
     <header> sg_header
       <h2> "Colours" + heading-style-h2
     <ul> sg_colour-grid
       <li> sg_colour-swatch (repeat for each colour)

   Call 3-5: Individual colour swatches (batched by 3-level limit)
   Each swatch: <div> with inline background-color + <p> with colour name

   Call 6: Typography section
   Parent: sg_component
     <header> sg_header
       <h2> "Typography" + heading-style-h2
     <div> sg_type-samples

   Call 7-9: Heading samples (h1-h6 with sample text)

   Call 10: Body text samples

   Call 11: Buttons section
   Parent: sg_component
     <header> sg_header
       <h2> "Buttons" + heading-style-h2
     <div> sg_button-grid

   Call 12: Button samples (one of each variant with label text)
```

**Estimated calls:** ~12-15 element_builder calls.

### Phase 2: Update CLAUDE.md and references

- Add new utility class names to CLAUDE.md (button classes, text-size classes)
- Add variable naming convention to CLAUDE.md
- Document Phase 2.5 in the Pipeline Loop section

### Phase 3: Update `/build-component` SKILL.md

- Insert Phase 2.5 instructions between Phase 2 and Phase 3
- Add error recovery for Phase 2.5 failures
- Add a note that Phase 3 can reuse Figma token data if extracted in Phase 2.5

## Acceptance Criteria

- [ ] `variable_tool` spike completed and documented in `docs/spike-results.md` *(deferred — will spike on first real run)*
- [x] `docs/reference/style-guide.md` created with all fallback token values
- [x] Phase 2.5 added to `skills/build-component/SKILL.md`
- [ ] On first `/build-component` run: Webflow variables created (Colors + Spacing collections)
- [ ] On first `/build-component` run: Typography styles created (h1-h6, text sizes) with responsive breakpoints
- [ ] On first `/build-component` run: Button styles created (primary, secondary, ghost, outline) with hover states
- [ ] On first `/build-component` run: Style Guide page created at `/style-guide` with sample elements
- [ ] On subsequent runs: Phase 2.5 detects existing styles/variables and skips (idempotent)
- [ ] Figma style guide frame detected and used when present (overrides fallback values)
- [ ] Fallback to `docs/reference/style-guide.md` when no Figma style guide exists
- [ ] Partial state handled: if some variables exist but not all, create only the missing ones
- [x] CLAUDE.md updated with new class names and variable conventions

## Dependencies & Risks

### Dependencies
- `variable_tool` must work as expected (untested — highest risk)
- `style_tool` must support `variable_as_value` for referencing Webflow variables
- `style_tool` must support `pseudo: "hover"` for button hover states
- `de_page_tool` must support creating pages with sitemap exclusion

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| `variable_tool` doesn't work as documented | Blocks entire feature | Spike test first. If broken, fall back to hardcoded values in styles (no variables) |
| `variable_as_value` not supported in `style_tool` | Colours aren't linked to variables | Use hardcoded hex values instead. Variables still exist for manual linking |
| 40+ style_tool calls consume too much context | Pipeline context exhaustion | Consider running Phase 2.5 in an Agent sub-task |
| Figma style guide frame detection is unreliable | Wrong frame selected or missed | Start with exact name match "Style Guide". Add fuzzy matching later if needed |
| Button hover pseudo-state not supported | Buttons look incomplete | Create noPseudo only. Document hover as manual step |

## Implementation Order

```
1. Spike variable_tool (prerequisite — blocks everything else)
2. Create docs/reference/style-guide.md (fallback token source)
3. Implement Phase 2.5 in SKILL.md (detection → variables → styles → page)
4. Update CLAUDE.md with new conventions
5. End-to-end test: run /build-component on a fresh site
```

## References & Research

### Internal References
- Brainstorm: `docs/brainstorms/2026-03-14-style-guide-generation-brainstorm.md`
- Typography scale: `docs/reference/breakpoints.md:31-67`
- Component patterns: `docs/reference/component-patterns.md`
- Spike results: `docs/spike-results.md`
- Build pipeline: `skills/build-component/SKILL.md`
- MCP limits: `~/.claude/projects/-Users-sanindo-webflow-mcp-test/memory/feedback_webflow_mcp_limits.md`

### External References
- Client-First style guide page: [Finsweet Client-First Docs](https://www.finsweet.com/client-first)
- Webflow Variables API: Webflow MCP `variable_tool` schema
