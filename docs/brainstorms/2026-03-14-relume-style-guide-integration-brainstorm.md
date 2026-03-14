# Brainstorm: Relume Style Guide Integration

**Date:** 2026-03-14
**Status:** Decisions captured
**Next:** `/workflows:plan` to implement the mapping layer

---

## What We're Building

An integration layer that maps Relume's starter template conventions to our project's naming system, so that Phase 2.5 of `/build-component` can sync Figma tokens into a Relume-cloned project without naming conflicts or duplicated variables.

The Relume template provides elements the MCP cannot create (rich text blocks with styled children, real form inputs, checkboxes, radios, toggles). Our automation only **syncs tokens** — it does not build the style guide page from scratch.

## Why This Approach

The Webflow MCP has hard limitations:
- Cannot style rich text children (nested All H2s, All Paragraphs, etc.)
- Cannot create real form elements (FormInput, FormTextarea, FormSelect)
- Cannot create component instances

By starting from a Relume template, these elements already exist with proper structure. The automation's job is to update variables and styles to match the specific project's design system.

## Key Decisions

### 1. Padding: Hybrid approach
- **Keep Relume's 3 section padding sizes** (`padding-section-small`, `padding-section-medium`, `padding-section-large`) but update values to our responsive scale
- **Update `padding-global`** from Relume's 5% to our fixed 2rem convention
- Relume defaults: small=3rem, medium=5rem, large=7rem
- Our responsive scale needs defining per size (e.g., large: 7rem desktop -> 5rem tablet -> 3rem mobile)

### 2. Containers: Use both
- **Keep Relume containers** (`container-large` 80rem, `container-medium` 64rem, `container-small` 48rem)
- **Add `container-xl`** as an alias or additional class mapping to `container-large`
- This gives more container options out of the box

### 3. Colours: Map Relume primitives to our palette
- **Update Relume's primitive variables** (neutral-shade-1 through 7) to match our neutral palette (#111111 through #FFFFFF)
- **Point Relume's color-scheme vars** to the updated primitives
- **Create our explicit variables** (color-primary, color-secondary, color-accent) alongside Relume's semantic system
- Relume's 10-scheme system stays functional for section theming

### 4. Text utilities: Cherry-pick useful ones
- **Adopt:** `text-weight-*` (xbold, bold, semibold, medium, normal, light) and `text-align-*` (left, center, right)
- **Skip:** `text-style-*` (italic, strikethrough, allcaps, etc.) and `text-size-tiny`
- **Keep:** `text-size-regular` from Relume (maps to our `text-size-medium` at 1rem)
- Our sizes: `text-size-large` (1.25rem), `text-size-medium` (1.125rem Relume / 1rem ours), `text-size-small` (0.875rem)

### 5. Buttons: Already aligned
- Relume uses `button` base + combo modifiers (`is-secondary`, `is-link`, `is-text`, `is-icon`, `is-small`, `is-alternate`)
- Our convention already matches: `button` base + `is-secondary`, `is-ghost`, `is-outline`
- Additional Relume modifiers (`is-small`, `is-icon`, `is-alternate`) are bonus — keep them

### 6. Forms: Use Relume's as-is
- Relume provides: `form_component`, `form_form`, `form_input`, `form_field-wrapper`, `form_field-label`, `form_checkbox`, `form_radio`, `is-text-area`, `is-select-input`
- These are real form elements the MCP can't create — use them directly
- Update colours/borders to match project tokens via variable sync

## Relume Template Inventory

### Variable Collections (4)

| Collection | Variables | Purpose |
|---|---|---|
| **Primitives** | 8 neutral shades + opacity variants | Base colour palette |
| **Color Schemes** | 5 vars x 10 schemes = 50 | Section theming |
| **Typography** | 2 (heading font, body font) | Font family references |
| **UI Styles** | 5 (3 radius sizes, border width, divider width) | Border/radius tokens |

### Style Count

| Category | Count | Key Classes |
|---|---|---|
| Typography | 49 | heading-style-h1-h6, text-size-*, text-weight-*, text-style-*, text-align-*, text-color-* |
| Buttons | 8 | button, is-secondary, is-small, is-link, is-text, is-icon, is-alternate, button-group |
| Forms | 16 | form_component, form_input, form_field-*, form_checkbox, form_radio, is-text-area, is-select-input |
| Layout | 272 | padding-global, padding-section-*, container-*, padding-*/margin-* directional, spacer-*, max-width-* |
| Effects | ~20 | shadow-xxsmall through xxlarge |
| Other | ~100 | color-scheme-*, hide-*, overflow-*, aspect-ratio-*, z-index-*, icon-*, tag, tabs, slider |
| **Total** | **~465** | |

### Style Guide Page Sections

1. **Navigation** — sticky sidebar with section links
2. **Header** — logo, version, external links
3. **Typography** — HTML tags, heading classes, text sizes, weights, styles, alignment, rich text block
4. **Colours** — color scheme swatches
5. **UI Elements** — buttons (all variants), tags, full form with all input types, icons (all sizes)
6. **Borders** — radius samples (large/medium/small)
7. **Effects** — shadow samples (xxsmall through xxlarge)
8. **Structure** — spacing scale, directions, max-width, overflow, aspect ratios, visibility, z-index

**Total elements:** ~1,869

## Mapping Table: Relume -> Project Conventions

### Variables

| Relume Variable | Our Convention | Action |
|---|---|---|
| `neutral-white` (#fff) | `color-neutral-0` | Update value if needed, create alias |
| `neutral-shade-1` (#eee) | `color-neutral-100` | Update to #F5F5F5 |
| `neutral-shade-2` (#ccc) | `color-neutral-300` | Update to #CCCCCC |
| `neutral-shade-3` (#aaa) | `color-neutral-500` | Update to #666666 |
| `neutral-shade-4` (#666) | `color-neutral-500` | (duplicate — decide which shade maps) |
| `neutral-shade-5` (#444) | `color-neutral-700` | Update to #333333 |
| `neutral-shade-6` (#222) | `color-neutral-900` | Update to #111111 |
| `neutral-shade-7` (black) | `color-neutral-900` | (duplicate — shade-7 is pure black vs our #111111) |
| (none) | `color-primary` | Create new |
| (none) | `color-secondary` | Create new |
| (none) | `color-accent` | Create new |
| (none) | `color-success/error/warning/info` | Create new |
| `font-style-heading` (system-ui) | — | Update to project font (e.g., Roboto) |
| `font-style-body` (system-ui) | — | Update to project font |
| `radius-large/medium/small` (all 0px) | — | Update to project values (e.g., 0.5rem) |
| (none) | `spacing-xxl` through `spacing-xxs` | Create new collection |

### Styles

| Relume Style | Our Convention | Action |
|---|---|---|
| `heading-style-h1` through `h6` | Same names | Update font-size/weight/line-height values |
| `text-size-large/medium/small` | Same names (medium differs: 1.125rem vs 1rem) | Update values |
| `text-size-regular` | Maps to our `text-size-medium` concept | Keep as-is |
| `button` | Same name | Update padding/colours to project tokens |
| `is-secondary` | Same name | Update colours |
| `is-link` / `is-text` | Maps to our `is-ghost` | Decide: rename or keep Relume's |
| `padding-global` | Same name, different value (5% vs 2rem) | Update to 2rem |
| `container-large` | `container-xl` alias | Create `container-xl` mapping to same width |
| `form_input`, `form_field-label`, etc. | Same naming pattern | Update colours/borders via variable sync |

## Open Questions

*None — all key decisions resolved.*

## Phase 2.5 Changes Required

The build-component SKILL.md Phase 2.5 has already been updated to a "verify & sync" approach. Additional refinements needed:

1. **Step 2.5.1 must build the mapping table** above automatically by querying Relume's variables and matching by name/purpose
2. **Step 2.5.3 must handle dual operations:** update existing Relume variables AND create missing project variables
3. **The reference doc** (`docs/reference/style-guide.md`) needs a "Relume Mapping" section documenting the variable/style correspondence
4. **CLAUDE.md** button convention section already updated to `button` + combo modifiers (matches Relume)
