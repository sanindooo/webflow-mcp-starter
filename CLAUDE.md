# Webflow Automation Pipeline

This project automates Figma-to-Webflow website building with visual verification via Playwright.

## Pipeline Loop

1. **Read** — Figma MCP extracts design specs
2. **Build** — Webflow MCP creates elements with correct structure and classes
3. **Capture** — Playwright screenshots the live Webflow page
4. **Compare** — Claude vision compares Figma reference vs Webflow screenshot
5. **Iterate** — Fix issues via Webflow MCP, re-capture, re-compare (max 5x)

## Class Naming Conventions (Client-First adapted)

### Structure
- **Section wrapper:** `section_component-name` (e.g., `section_two-img-imba`)
- **Component elements:** `component-name_element` with underscore separator (e.g., `two-img-imba_small-side`, `two-img-imba_header`)
- **Modifiers:** `is-` prefix (e.g., `is-2`, `is-animated`, `is-link`, `is-decor`)

### Utility Classes
- Layout: `container-xl`, `padding-global`, `padding-section-xl`
- Typography: `heading-style-h2`, `text-rich-text`
- Images: `u-image`
- Responsive: `mob-is-top-none` (prefix pattern)

### Semantic HTML (mandatory)
- `<section>` for page sections
- `<article>` for component wrappers (NOT divs)
- `<figure>` for images
- `<header>` for heading areas
- `<footer>` for CTA areas
- Proper heading hierarchy (`<h1>`, `<h2>`, etc.)

### Accessibility
- `aria-label` on headings and text elements with full readable text
- GSAP SplitText handles word-by-word animation at runtime — the automation does NOT create split divs

### Custom Attributes
- `data-animation-general` — section animation trigger
- `data-animation-order` — animation sequencing (0, 1, 2, 3...)
- `mq="mob"` / `mq="desk"` — responsive visibility
- `button-function` / `button-function-arg1` / `button-function-arg2` — button behavior
- `data-eapps-font-size` / `data-eapps-line-height` — responsive font scaling

## Automation Boundary

### What the automation handles
- HTML structure, class names, content, images, links
- Custom data attributes
- Semantic elements and accessibility attributes

### What GSAP handles at runtime (NOT automated)
- Text splitting animations (SplitText)
- Clip-path reveals
- Scroll-triggered effects
- `aria-hidden="true"` on split text wrappers

## Component Variants
- Use `is-` modifier classes for variants, NOT separate components
- Example: `two-img-imba_component` + `is-2` for the reversed layout

## Visual Testing
- Playwright captures Webflow screenshots at 1440x900 viewport
- Claude vision compares against Figma reference (primary)
- Playwright `toHaveScreenshot()` for regression between iterations (secondary)
- Baseline URL: configured in `playwright.config.ts`

## Webflow MCP Notes
- Element Builder limited to 3 nesting levels per operation — use multiple sequential operations for deeper structures
- Designer API requires Webflow Designer open + companion app running
- Images must be pre-uploaded to Webflow asset library (MCP can't upload)
- Publish via `sites-publish` after building, then wait before screenshotting
