# Breakpoints & Responsive Scale

## Webflow Breakpoints

| Name   | Max Width | Applies To       |
|--------|-----------|------------------|
| main   | (none)    | Desktop 992px+   |
| medium | 991px     | Tablet           |
| small  | 767px     | Mobile Landscape |
| tiny   | 478px     | Mobile Portrait  |

Styles set at `main` cascade to all smaller breakpoints. Only override at a breakpoint where the value actually differs.

---

## Global Padding

`padding-global`: fixed **2rem** left/right at all breakpoints. NOT percentage-based.

Applied to the wrapper div inside sections. Combined with a `padding-section-*` combo class for vertical spacing.

---

## Section Padding Scale

Three sizes adopted from the Relume template with responsive overrides:

| Class                    | main  | medium | small  | tiny   |
|--------------------------|-------|--------|--------|--------|
| `padding-section-large`  | 7rem  | 5rem   | 3.5rem | 2.5rem |
| `padding-section-medium` | 5rem  | 3.5rem | 2.5rem | 2rem   |
| `padding-section-small`  | 3rem  | 2rem   | 1.5rem | 1rem   |

**Usage pattern — every section follows this exact structure:**
```
<section> .section_[layout-name]                         ← outer section wrapper
  <div> .padding-global .padding-section-large           ← horizontal + vertical padding
    <div> .container-large                               ← max-width constraint
      <article> .[component-name]_component              ← component root (layout starts here)
        |
        +-- <header> .[component]_header                 ← heading area
        |     +-- <h2> .[component]_heading
        |     +-- <p> .[component]_description
        |
        +-- <figure> .[component]_image-wrapper          ← image area
        |     +-- <img> .u-image
        |
        +-- <footer> .[component]_cta                    ← CTA area
              +-- <a> .button .is-link
      </article>
    </div>
  </div>
</section>
```

**Building in element_builder (3-level limit):**
```
Call 1: DivBlock(section) > DivBlock(padding-global) > DivBlock(container-large)
Call 2: DivBlock(article) appended inside container-large > child elements
Call 3: Deeper nesting as needed inside the component
```

**Paragraph styling strategy:**
- Do NOT add classes directly to `<p>` tags — this adds bloat and overrides global paragraph styles
- Instead, wrap paragraphs in a `DivBlock` with the styling class (e.g., `about_body`)
- Use text utility classes (`text-size-small`, `text-size-large`) on the wrapper div for size overrides
- This keeps global `<p>` styles clean and lets each paragraph inherit naturally

**Rules:**
- All elements use `type: "DivBlock"` — set semantic tags (section, article, header, footer, figure) later in Designer
- Section class names describe **layout pattern** not content (e.g., `section_split-image` not `section_about`)
- Custom layout properties (flex, gap, grid) only go on `_component` and below — never on section/padding/container
- Use `<header>` for heading areas, `<footer>` for CTA areas, `<figure>` for images, `<article>` for component wrappers

---

## Container Widths

| Class              | Max Width | Purpose            |
|--------------------|-----------|---------------------|
| `container-large`  | 80rem     | Full-width sections |
| `container-medium` | 64rem     | Standard content    |
| `container-small`  | 48rem     | Narrow content      |
| `container-xl`     | 80rem     | Alias for container-large (project convention) |

All containers use `margin-left: auto; margin-right: auto` for centering.

---

## Typography Responsive Scale

See `style-guide.md` for per-heading breakpoint values.

General principle: headings scale down ~75-80% at tablet, ~50-60% at mobile. Body text stays at 1rem minimum on mobile to prevent iOS auto-zoom on input focus.

### Fluid Typography with CSS `clamp()`

For large headings or text that needs to scale smoothly between breakpoints (especially on mobile), use CSS `clamp()` instead of fixed breakpoint overrides. This prevents awkward text wrapping at in-between viewport sizes.

**Generator tool:** https://clamp.font-size.app/

**When to use:**
- Large headings (h1/h2) that wrap differently at various widths
- Mobile breakpoints where fixed steps create jarring size jumps
- Any text where line breaks are important to the design

**When NOT to use:**
- Body text at standard sizes (1rem) — fixed sizes are fine
- Desktop-only text that doesn't change across breakpoints

**Example:**
```css
/* Instead of: */
font-size: 5.625rem;  /* desktop */
/* @media (max-width: 478px) { font-size: 2.5rem; } */

/* Use: */
font-size: clamp(2.5rem, 1.5rem + 5vw, 5.625rem);
```

**In Webflow:** Apply `clamp()` via custom CSS (either inline style or via `/custom-code-management`) since Webflow's style panel doesn't support `clamp()` natively. Alternatively, set the base size in the style panel and use clamp via a custom attribute `style="font-size: clamp(...)"` for specific elements.

---

## Spacing Responsive Scaling

Spacing variables don't have built-in breakpoint support in Webflow. When applying spacing at different breakpoints, use these scaling factors:

| Breakpoint | Scale Factor     |
|------------|------------------|
| main       | 100% (base)      |
| medium     | 75-80% of main   |
| small      | 50-60% of main   |
| tiny       | 40-50% of main   |
