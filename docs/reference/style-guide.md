# Style Guide — Default Token Reference

Fallback token definitions for the style guide generation phase (Phase 2.5 of `/build-component`). Used when no Figma style guide frame exists.

When a Figma file contains a "Style Guide" frame, tokens are extracted from Figma instead and these defaults are ignored.

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
| `spacing-xxl` | 128px | Hero sections |
| `spacing-xl` | 80px | Section padding (maps to `padding-section-xl`) |
| `spacing-lg` | 64px | Large gaps |
| `spacing-md` | 40px | Medium gaps |
| `spacing-sm` | 24px | Small gaps |
| `spacing-xs` | 16px | Tight gaps |
| `spacing-xxs` | 8px | Minimal gaps |

Responsive scaling follows `breakpoints.md` percentages:
- `medium`: 75-80% of `main`
- `small`: 50-60% of `main`
- `tiny`: 40-50% of `main`

---

## Button Styles

### Variants

| Class | Background | Border | Text Color | Padding (top/bottom) | Padding (left/right) | Border-Radius |
|---|---|---|---|---|---|---|
| `button-primary` | `color-accent` var | none | `color-neutral-0` var | 12px | 24px | 8px |
| `button-secondary` | `color-neutral-100` var | 1px solid `color-neutral-300` var | `color-neutral-900` var | 12px | 24px | 8px |
| `button-ghost` | transparent | none | `color-accent` var | 12px | 24px | 8px |
| `button-outline` | transparent | 1px solid `color-accent` var | `color-accent` var | 12px | 24px | 8px |

All buttons share: `font-weight: 600`, `font-size: 1rem`, `cursor: pointer`, `text-decoration: none`.

### Hover States (pseudo: "hover")

| Class | Hover Change |
|---|---|
| `button-primary` | `opacity: 0.85` |
| `button-secondary` | `background-color` → `color-neutral-300` var |
| `button-ghost` | `opacity: 0.7` |
| `button-outline` | `background-color` → `color-accent` var, `color` → `color-neutral-0` var |

### Responsive (tablet/mobile)

All buttons get `min-height: 44px` at `medium`, `small`, and `tiny` breakpoints (WCAG 2.1 touch target requirement).

---

## Style Guide Page Structure

When Phase 2.5 creates the Style Guide page in Webflow:

- **Page title:** "Style Guide"
- **Slug:** `/style-guide`
- **Hidden from nav / excluded from sitemap**

### Page Layout

```
<section> sg_section + padding-global
  <div> container-xl
    <article> sg_component

      <header> sg_header
        <h1> "Style Guide" + heading-style-h1

      <!-- Colours Section -->
      <div> sg_section-block
        <h2> "Colours" + heading-style-h2
        <div> sg_colour-grid
          (one swatch per colour variable: div with background + label)

      <!-- Typography Section -->
      <div> sg_section-block
        <h2> "Typography" + heading-style-h2
        <div> sg_type-samples
          <h1> "Heading 1" + heading-style-h1
          <h2> "Heading 2" + heading-style-h2
          <h3> "Heading 3" + heading-style-h3
          <h4> "Heading 4" + heading-style-h4
          <h5> "Heading 5" + heading-style-h5
          <h6> "Heading 6" + heading-style-h6
          <p> "Large body text..." + text-size-large
          <p> "Medium body text..." + text-size-medium
          <p> "Small body text..." + text-size-small

      <!-- Buttons Section -->
      <div> sg_section-block
        <h2> "Buttons" + heading-style-h2
        <div> sg_button-grid
          <a> "Primary Button" + button-primary
          <a> "Secondary Button" + button-secondary
          <a> "Ghost Button" + button-ghost
          <a> "Outline Button" + button-outline
```

### Class Naming

All Style Guide page classes use the `sg_` prefix:
- `sg_section` — outer section wrapper
- `sg_component` — main article wrapper
- `sg_header` — page header
- `sg_section-block` — content block for each category
- `sg_colour-grid` — grid layout for colour swatches
- `sg_colour-swatch` — individual swatch wrapper
- `sg_colour-label` — swatch text label
- `sg_type-samples` — vertical stack of typography samples
- `sg_button-grid` — horizontal layout for button samples
