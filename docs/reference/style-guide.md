# Style Guide — Token Reference

Token definitions for the style guide sync phase (Phase 2.5 of `/build-component`).

## Template Approach

Every Webflow project starts from a Relume-based style guide template. This template provides elements the MCP cannot create programmatically (rich text blocks with styled children, real form inputs, checkboxes, radios, toggles). The automation **syncs tokens** from Figma into the existing template rather than building from scratch.

**The Relume template may ship with its own variable collections and class names.** Always inventory existing variables/styles first and update them rather than creating duplicates.

When a Figma file contains a "Style Guide" frame, tokens are extracted from Figma and override the defaults below. When no Figma style guide is available (or Figma is rate-limited), these defaults are used as fallback.

---

## Typography

### Heading Styles

Derived from a ~1.25 major-third ratio, scaling down from `heading-style-h1` at 4rem.

| Class | `main` | `medium` | `small` | `tiny` | weight | line-height |
|---|---|---|---|---|---|---|
| `heading-style-h1` | 4rem | 3.375rem | 2.75rem | 2.25rem | 700 | 1.1 |
| `heading-style-h2` | 3rem | 2.5rem | 2.125rem | 2.125rem | 700 | 1.2 |
| `heading-style-h3` | 2.5rem | 2.125rem | 1.75rem | 1.75rem | 700 | 1.3 |
| `heading-style-h4` | 2rem | 1.75rem | 1.5rem | 1.5rem | 600 | 1.3 |
| `heading-style-h5` | 1.5rem | 1.25rem | 1.125rem | 1.125rem | 600 | 1.4 |
| `heading-style-h6` | 1.25rem | 1.125rem | 1rem | 1rem | 600 | 1.4 |

All headings use `color` from the `color-neutral-900` variable.

### Text Styles

| Class | `main` | `medium` | `small` | `tiny` | weight | line-height |
|---|---|---|---|---|---|---|
| `text-size-large` | 1.25rem | 1.125rem | 1rem | 1rem | 400 | 1.6 |
| `text-size-medium` | 1rem | 1rem | 1rem | 1rem | 400 | 1.6 |
| `text-size-small` | 0.875rem | 0.875rem | 0.875rem | 0.875rem | 400 | 1.6 |
| `text-rich-text` | 1rem | 1rem | 1rem | 1rem | 400 | 1.6 |

All text styles use `color` from the `color-neutral-700` variable.

**Note:** 1rem (16px) minimum on mobile prevents iOS auto-zoom on input focus.

**Important:** Always use these existing styles via class application — never create custom heading or text styles. If a section needs overrides (different color, text-transform), add a combo class: `.heading-style-h2` + `.[section]_heading`. The combo class should ONLY contain the override properties.

---

## Colour Variables

**Collection name:** `Colors`

### Brand Colours

| Variable Name | Default Value | Purpose |
|---|---|---|
| `color-primary` | `#1A1A2E` | Primary brand colour |
| `color-secondary` | `#16213E` | Secondary brand colour |
| `color-accent` | `#0F3460` | Accent / CTA colour |

### Neutral Palette

| Variable Name | Default Value | Purpose |
|---|---|---|
| `color-neutral-900` | `#111111` | Darkest neutral (headings) |
| `color-neutral-700` | `#333333` | Dark text (body copy) |
| `color-neutral-500` | `#666666` | Muted text (captions, labels) |
| `color-neutral-300` | `#CCCCCC` | Borders, dividers |
| `color-neutral-100` | `#F5F5F5` | Light backgrounds |
| `color-neutral-0` | `#FFFFFF` | White |

### Semantic Colours

| Variable Name | Default Value | Purpose |
|---|---|---|
| `color-success` | `#22C55E` | Success states |
| `color-error` | `#EF4444` | Error states |
| `color-warning` | `#F59E0B` | Warning states |
| `color-info` | `#3B82F6` | Info states |

---

## Spacing Variables

**Collection name:** `Spacing`

| Variable Name | Value | Purpose |
|---|---|---|
| `spacing-xxl` | 8rem | Hero sections |
| `spacing-xl` | 5rem | Section padding |
| `spacing-lg` | 4rem | Large gaps |
| `spacing-md` | 2.5rem | Medium gaps |
| `spacing-sm` | 1.5rem | Small gaps |
| `spacing-xs` | 1rem | Tight gaps |
| `spacing-xxs` | 0.5rem | Minimal gaps |

Responsive scaling follows `breakpoints.md` percentages:
- `medium`: 75-80% of `main`
- `small`: 50-60% of `main`
- `tiny`: 40-50% of `main`

---

## Button Styles

Uses a base `.button` class with combo modifier classes for variants.

### Base Class: `button`

All shared properties: `font-weight: 600`, `font-size: 1rem`, `cursor: pointer`, `text-decoration: none`, `display: inline-block`, `padding: 0.75rem 1.5rem`, `border-radius: 0.5rem`.

Default appearance (primary): `background-color` → `color-accent` var, `color` → `color-neutral-0` var.

### Combo Modifiers

| Combo Class | Overrides |
|---|---|
| `button` (alone) | Primary — accent bg, white text |
| `button` + `is-secondary` | neutral-100 bg, neutral-900 text, 1px solid neutral-300 border |
| `button` + `is-ghost` | transparent bg, accent text, keeps padding |
| `button` + `is-outline` | transparent bg, accent text, 1px solid accent border |
| `button` + `is-link` | No bg, no border, no padding — bare text link (from Relume) |
| `button` + `is-text` | Inline-block, no decoration (from Relume) |
| `button` + `is-small` | Reduced padding 0.5rem/1.25rem (from Relume) |
| `button` + `is-icon` | Flex with 0.75rem gap for icon + text (from Relume) |
| `button` + `is-alternate` | Inverted colours for dark backgrounds (from Relume) |

### Hover States (pseudo: "hover")

| Variant | Hover Change |
|---|---|
| `button` (primary) | `opacity: 0.85` |
| `is-secondary` | `background-color` → `color-neutral-300` var |
| `is-ghost` | `opacity: 0.7` |
| `is-outline` | `background-color` → `color-accent` var, `color` → `color-neutral-0` var |

### Responsive (tablet/mobile)

All buttons get `min-height: 2.75rem` (44px) at `medium` breakpoint (WCAG 2.1 touch target requirement).

---

## Style Guide Page

### Source

The Style Guide page is **cloned from a Relume-based template** — not generated from scratch. The template provides elements the MCP cannot create programmatically:

- Rich text blocks with styled children (All H2s, All Paragraphs, All Links, etc.)
- Real form elements (FormInput, FormTextarea, FormSelect, checkboxes, radios, toggles)
- Pre-configured rich text nested styling
- Properly structured colour swatches, typography samples, and button variants

### What the automation does

Phase 2.5 **syncs tokens** into the template:
1. Updates existing variable collections with Figma-extracted (or fallback) colour/spacing values
2. Updates existing typography and button styles to match the design system
3. Verifies all foundational classes exist

### What requires manual work

- Styling rich text children (nested element types within a RichText block)
- Creating real form elements (must come from the template)
- Any element types the MCP can't create (see CLAUDE.md → MCP Limitations)

### Expected sections

The style guide page should contain at minimum:
- **Colours** — swatches for all colour variables
- **Typography** — heading samples (h1-h6) and body text (large, medium, small)
- **Buttons** — primary, secondary, ghost, outline using `button` + combo classes
- **Form Inputs** — text input, textarea, select, with labels and helper/error text
- **Rich Text** — a rich text block with styled children demonstrating content hierarchy

### Relume template variables

The Relume starter ships with its own variable collections. The automation must:
1. **Inventory** existing Relume variables before creating new ones
2. **Map** Relume names to project convention names
3. **Update** existing variables with project tokens rather than creating duplicates

---

## Relume Template Mapping

Reference tables for Phase 2.5 token sync. The Relume starter template (v3) ships with 4 variable collections and ~465 styles. The automation uses these tables to decide what to update vs create.

### Variable Mapping

#### Primitives -> Project Colours

| Relume Primitive | Relume Default | Project Variable | Project Value |
|---|---|---|---|
| `neutral-white` | #fff | `color-neutral-0` | #FFFFFF |
| `neutral-shade-1` | #eee | `color-neutral-100` | #F5F5F5 |
| `neutral-shade-2` | #ccc | `color-neutral-300` | #CCCCCC |
| `neutral-shade-3` | #aaa | (keep as primitive) | -- |
| `neutral-shade-4` | #666 | `color-neutral-500` | #666666 |
| `neutral-shade-5` | #444 | `color-neutral-700` | #333333 |
| `neutral-shade-6` | #222 | (keep as primitive) | -- |
| `neutral-shade-7` | black | `color-neutral-900` | #111111 |

Relume shade-3 (#aaa) and shade-6 (#222) have no project equivalent. They remain as Relume primitives for internal color-scheme references.

#### Variables to Create (not in Relume)

| Variable | Collection | Type | Default |
|---|---|---|---|
| `color-primary` | Colors | color | #1A1A2E |
| `color-secondary` | Colors | color | #16213E |
| `color-accent` | Colors | color | #0F3460 |
| `color-success` | Colors | color | #22C55E |
| `color-error` | Colors | color | #EF4444 |
| `color-warning` | Colors | color | #F59E0B |
| `color-info` | Colors | color | #3B82F6 |
| `spacing-xxl` | Spacing | size | 8rem |
| `spacing-xl` | Spacing | size | 5rem |
| `spacing-lg` | Spacing | size | 4rem |
| `spacing-md` | Spacing | size | 2.5rem |
| `spacing-sm` | Spacing | size | 1.5rem |
| `spacing-xs` | Spacing | size | 1rem |
| `spacing-xxs` | Spacing | size | 0.5rem |

#### Relume Variables to Update

| Variable | Relume Default | Update To |
|---|---|---|
| `font-style-heading` | system-ui | (project font from Figma) |
| `font-style-body` | system-ui | (project font from Figma) |
| `radius-large` | 0px | (project value from Figma) |
| `radius-medium` | 0px | (project value from Figma) |
| `radius-small` | 0px | (project value from Figma) |

### Style Mapping

| Relume Style | Project Convention | Action |
|---|---|---|
| `heading-style-h1` through `h6` | Same names | Update values from Figma |
| `text-size-large` | Same name | Update value |
| `text-size-medium` | Same name (1.125rem -> 1rem) | Update value |
| `text-size-regular` | Keep (Relume extra) | Keep as-is |
| `text-size-small` | Same name | Update value |
| `text-size-tiny` | Skip | Leave as-is |
| `text-weight-*` | Adopt all (xbold, bold, semibold, medium, normal, light) | Keep as-is |
| `text-align-*` | Adopt all (left, center, right) | Keep as-is |
| `text-style-*` | Skip | Leave as-is |
| `button` | Same name | Update values |
| `is-secondary` | Same name | Update colours |
| `is-link` | Keep (Relume) | Keep as-is |
| `is-text` | Keep (Relume) | Keep as-is |
| `is-small` | Adopt | Keep as-is |
| `is-icon` | Adopt | Keep as-is |
| `is-alternate` | Adopt | Keep as-is |
| (new) `is-ghost` | Create | New combo class |
| (new) `is-outline` | Create | New combo class |
| `padding-global` | Same name (5% -> 2rem) | Update value |
| `padding-section-large` | Same name (7rem) | Update responsive breakpoints |
| `padding-section-medium` | Same name (5rem) | Update responsive breakpoints |
| `padding-section-small` | Same name (3rem) | Update responsive breakpoints |
| `container-large` | Keep + add `container-xl` alias | Keep |
| `container-medium` | Keep | Keep as-is |
| `container-small` | Keep | Keep as-is |
| `form_*` | Same pattern | Update via variable sync |
