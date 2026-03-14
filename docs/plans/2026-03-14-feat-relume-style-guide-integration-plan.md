---
title: "feat: Relume Style Guide Integration"
type: feat
status: completed
date: 2026-03-14
brainstorm: docs/brainstorms/2026-03-14-relume-style-guide-integration-brainstorm.md
---

# Relume Style Guide Integration

## Overview

Update the build-component pipeline so Phase 2.5 properly integrates with a Relume-cloned Webflow starter template. This involves:
1. Documenting the Relume-to-project variable/style mapping
2. Rewriting Phase 2.5 to be Relume-aware (inventory -> map -> sync)
3. Updating reference docs with the hybrid convention decisions
4. Resolving naming ambiguities discovered during brainstorming

## Problem Statement

The automation currently describes a "verify & sync" approach in SKILL.md but lacks the concrete mapping logic to translate between Relume's naming conventions and our project conventions. Without this, Phase 2.5 cannot reliably:
- Know which Relume variables to update vs which to create fresh
- Handle the neutral shade mismatch (Relume has 8, we have 6)
- Decide what to do with Relume button variants that don't exist in our system (`is-link`, `is-text`, `is-alternate`)
- Apply the hybrid padding decisions

## Proposed Solution

Update documentation and the SKILL.md in three phases: resolve ambiguities, document the mapping, update the pipeline.

## Acceptance Criteria

- [x] Neutral shade mapping fully defined (8 Relume -> 6 project)
- [x] Button variant mapping decided (`is-link`/`is-text` -> `is-ghost` or keep both)
- [x] `docs/reference/style-guide.md` has a "Relume Mapping" section with variable and style correspondence tables
- [x] `docs/reference/style-guide.md` button section uses base `button` + combo pattern (already done)
- [x] `docs/reference/breakpoints.md` created with responsive scale definitions
- [x] `.claude/skills/build-component/SKILL.md` Phase 2.5 has concrete Relume-aware inventory and mapping steps
- [x] `CLAUDE.md` updated to reflect hybrid padding (3 sizes), container aliases, and adopted text utilities
- [x] Stale plan doc (`2026-03-14-feat-style-guide-generation-on-init-plan.md`) button references cleaned up or archived

---

## Implementation Phases

### Phase 1: Resolve Naming Ambiguities

Before any doc changes, lock down the two remaining decisions.

#### 1a. Neutral shade mapping

Relume has 8 shades, we have 6 named neutrals. Proposed mapping:

```
Relume                  Project Convention      Hex (project)
────────────────────────────────────────────────────────────
neutral-white (#fff)    color-neutral-0         #FFFFFF
neutral-shade-1 (#eee)  color-neutral-100       #F5F5F5
neutral-shade-2 (#ccc)  color-neutral-300       #CCCCCC
neutral-shade-3 (#aaa)  (unmapped — keep as Relume primitive)
neutral-shade-4 (#666)  color-neutral-500       #666666
neutral-shade-5 (#444)  color-neutral-700       #333333
neutral-shade-6 (#222)  (unmapped — keep as Relume primitive)
neutral-shade-7 (black) color-neutral-900       #111111
```

Relume's shade-3 and shade-6 have no direct project equivalent. They stay as Relume primitives — useful for color-scheme internal references but not exposed as project-level tokens.

**Action:** Confirm this mapping, then document in style-guide.md.

#### 1b. Button variant mapping

Relume provides button modifiers we don't have:

| Relume Modifier | Our Equivalent | Decision |
|---|---|---|
| `is-secondary` | `is-secondary` | Same — no action |
| `is-link` | `is-ghost` (closest) | **Keep both.** `is-link` removes all visual chrome (no bg, no border, no padding) — different from `is-ghost` which keeps padding. |
| `is-text` | `is-ghost` (closest) | **Keep.** `is-text` is inline-block with no decoration — useful for inline text links. |
| `is-small` | (none) | **Adopt.** Useful size variant. |
| `is-icon` | (none) | **Adopt.** Flex layout with gap for icon buttons. |
| `is-alternate` | (none) | **Adopt.** Inverted colors for dark backgrounds. |

**Action:** Keep all Relume button modifiers. Add `is-ghost` and `is-outline` as new combo classes alongside Relume's. Document the full set.

---

### Phase 2: Update Reference Documentation

#### 2a. Create `docs/reference/breakpoints.md`

```markdown
# Breakpoints & Responsive Scale

## Webflow Breakpoints

| Name   | Max Width | Applies To          |
|--------|-----------|---------------------|
| main   | (none)    | Desktop 992px+      |
| medium | 991px     | Tablet              |
| small  | 767px     | Mobile Landscape    |
| tiny   | 478px     | Mobile Portrait     |

## Section Padding Scale (Hybrid — 3 Relume sizes)

| Class                    | main  | medium | small | tiny  |
|--------------------------|-------|--------|-------|-------|
| padding-section-large    | 7rem  | 5rem   | 3.5rem| 2.5rem|
| padding-section-medium   | 5rem  | 3.5rem | 2.5rem| 2rem  |
| padding-section-small    | 3rem  | 2rem   | 1.5rem| 1rem  |

## Global Padding

`padding-global`: fixed 2rem left/right at all breakpoints (NOT 5%).

## Typography Responsive Scale

See style-guide.md for per-heading breakpoint values.

## Spacing Responsive Scaling

- medium: 75-80% of main
- small: 50-60% of main
- tiny: 40-50% of main
```

#### 2b. Add Relume Mapping section to `docs/reference/style-guide.md`

Add after the "Style Guide Page" section:

```markdown
## Relume Template Mapping

### Variable Mapping

#### Primitives -> Project Colors

| Relume Primitive          | Relume Default | Project Variable    | Project Value |
|---------------------------|---------------|---------------------|---------------|
| neutral-white             | #fff          | color-neutral-0     | #FFFFFF       |
| neutral-shade-1           | #eee          | color-neutral-100   | #F5F5F5       |
| neutral-shade-2           | #ccc          | color-neutral-300   | #CCCCCC       |
| neutral-shade-3           | #aaa          | (keep as primitive) | —             |
| neutral-shade-4           | #666          | color-neutral-500   | #666666       |
| neutral-shade-5           | #444          | color-neutral-700   | #333333       |
| neutral-shade-6           | #222          | (keep as primitive) | —             |
| neutral-shade-7           | black         | color-neutral-900   | #111111       |

#### Variables to Create (not in Relume)

| Variable           | Collection | Type  | Default   |
|--------------------|-----------|-------|-----------|
| color-primary      | Colors    | color | #1A1A2E   |
| color-secondary    | Colors    | color | #16213E   |
| color-accent       | Colors    | color | #0F3460   |
| color-success      | Colors    | color | #22C55E   |
| color-error        | Colors    | color | #EF4444   |
| color-warning      | Colors    | color | #F59E0B   |
| color-info         | Colors    | color | #3B82F6   |
| spacing-xxl        | Spacing   | size  | 8rem      |
| spacing-xl         | Spacing   | size  | 5rem      |
| spacing-lg         | Spacing   | size  | 4rem      |
| spacing-md         | Spacing   | size  | 2.5rem    |
| spacing-sm         | Spacing   | size  | 1.5rem    |
| spacing-xs         | Spacing   | size  | 1rem      |
| spacing-xxs        | Spacing   | size  | 0.5rem    |

#### Relume Variables to Update

| Variable                  | Relume Default | Update To        |
|---------------------------|---------------|------------------|
| font-style-heading        | system-ui     | (project font)   |
| font-style-body           | system-ui     | (project font)   |
| radius-large              | 0px           | (project value)  |
| radius-medium             | 0px           | (project value)  |
| radius-small              | 0px           | (project value)  |

### Style Mapping

| Relume Style              | Project Convention   | Action        |
|---------------------------|---------------------|---------------|
| heading-style-h1-h6       | Same names          | Update values |
| text-size-large           | Same name           | Update value  |
| text-size-medium          | Same name (1.125rem → 1rem) | Update value |
| text-size-regular         | Keep (Relume extra) | Keep as-is    |
| text-size-small           | Same name           | Update value  |
| text-size-tiny            | Skip                | Leave as-is   |
| text-weight-*             | Adopt all           | Keep as-is    |
| text-align-*              | Adopt all           | Keep as-is    |
| text-style-*              | Skip                | Leave as-is   |
| button                    | Same name           | Update values |
| is-secondary              | Same name           | Update colors |
| is-link                   | Keep (Relume)       | Keep as-is    |
| is-text                   | Keep (Relume)       | Keep as-is    |
| is-small                  | Adopt               | Keep as-is    |
| is-icon                   | Adopt               | Keep as-is    |
| is-alternate              | Adopt               | Keep as-is    |
| (new) is-ghost            | Create              | New combo     |
| (new) is-outline          | Create              | New combo     |
| padding-global            | Same name (5% → 2rem) | Update value |
| padding-section-large     | Same name (7rem)    | Update responsive |
| padding-section-medium    | Same name (5rem)    | Update responsive |
| padding-section-small     | Same name (3rem)    | Update responsive |
| container-large           | Keep + add container-xl alias | Keep |
| container-medium          | Keep                | Keep as-is    |
| container-small           | Keep                | Keep as-is    |
| form_*                    | Same pattern        | Update via vars |
```

#### 2c. Update CLAUDE.md conventions

Files to update:
- `CLAUDE.md:22-28` — Update utility class docs:
  - Change `padding-section-xl` to `padding-section-large/medium/small`
  - Add `container-large/medium/small` alongside `container-xl`
  - Add `text-weight-*` and `text-align-*` to adopted utilities
  - Keep button convention as-is (already correct)

---

### Phase 3: Update SKILL.md Phase 2.5

Rewrite Step 2.5.1 (Inventory) to include concrete Relume-aware logic:

```
### Step 2.5.1: Inventory & Map Relume Template

1. Query all variable collections:
   variable_tool → get_variable_collections (query: "all")

2. For each collection, get all variables:
   variable_tool → get variables in collection

3. Build mapping table by matching:
   a. Relume "Primitives" collection → map neutral shades to project color-neutral-* names
   b. Relume "Typography" collection → note font-style-heading/body variable IDs
   c. Relume "UI Styles" collection → note radius/border variable IDs
   d. Relume "Color Schemes" collection → note scheme variable IDs (update later)

4. Query all styles:
   style_tool → get_styles (query: "all", skip_properties: false)

5. Categorize existing styles:
   a. Typography: heading-style-*, text-size-*, text-weight-*, text-align-*
   b. Buttons: button, is-secondary, is-link, is-text, is-small, is-icon, is-alternate
   c. Forms: form_*, is-text-area, is-select-input
   d. Layout: padding-global, padding-section-*, container-*
   e. Missing from project convention: is-ghost, is-outline, container-xl

6. Output: mapping_table = {
     variables: { relume_id → { relume_name, project_name, action, new_value } },
     styles: { relume_name → { project_name, action, properties_to_update } },
     to_create: [ list of variables/styles not in template ]
   }
```

Update Step 2.5.3 (Sync Variables) to use the mapping table:

```
For each entry in mapping_table.variables where action = "update":
  variable_tool → update variable value

For each entry in mapping_table.to_create where type = "variable":
  variable_tool → create variable (in appropriate collection)
```

Update Step 2.5.4 (Sync Styles) similarly:

```
For each entry in mapping_table.styles where action = "update":
  style_tool → update_style with new property values
  Apply breakpoint overrides where values differ

For each entry in mapping_table.to_create where type = "style":
  style_tool → create_style
  (specifically: is-ghost, is-outline, container-xl)
```

---

### Phase 4: Cleanup

- [ ] Archive or update stale plan doc (`2026-03-14-feat-style-guide-generation-on-init-plan.md`) — button references still use old `button-primary` naming
- [ ] Update MEMORY.md if any feedback memories need refreshing
- [ ] Verify all cross-references in SKILL.md point to correct file paths

---

## Dependencies & Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Relume template structure varies between versions | Medium | Document the specific Relume version tested against; Step 2.5.1 inventory handles unknowns gracefully |
| `variable_tool` update action untested | High | Test updating an existing Relume variable before full sync run |
| Neutral shade mapping doesn't match design intent | Low | shade-3 and shade-6 kept as Relume primitives — no destructive changes |
| Future Relume updates change variable names | Low | Inventory step always queries fresh; mapping adapts |

## References

### Internal
- Brainstorm: `docs/brainstorms/2026-03-14-relume-style-guide-integration-brainstorm.md`
- Pipeline skill: `.claude/skills/build-component/SKILL.md`
- Token reference: `docs/reference/style-guide.md`
- Conventions: `CLAUDE.md`
- MCP limits: `.claude/projects/-Users-sanindo-webflow-mcp-test/memory/feedback_webflow_mcp_limits.md`
- Button feedback: `.claude/projects/-Users-sanindo-webflow-mcp-test/memory/feedback_button_class_structure.md`

### Relume Template Inspected
- Site: `mcp-test-1a578e.webflow.io` (siteId: `69b54b480e154ad5f39ace4a`)
- 4 variable collections, ~465 styles, ~1,869 elements on style guide page
