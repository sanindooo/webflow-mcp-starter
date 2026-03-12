# Webflow Automation Pipeline — Brainstorm

**Date:** 2026-03-12
**Status:** Brainstorm complete

## What We're Building

A single-agent automation pipeline that takes a Figma design and builds it in Webflow, then visually verifies the output — end-to-end.

**The loop:**
1. **Read** — Figma MCP extracts design specs (layout, structure, content, styles)
2. **Build** — Webflow MCP creates pages/components with correct semantic HTML and Client-First class naming
3. **Test** — Playwright screenshots the live Webflow output and compares to the Figma design
4. **Iterate** — On mismatch: Claude analyzes the diff, adjusts Webflow via MCP, re-tests (configurable: auto-iterate or flag for manual review)

**Target fidelity:** Structural and visual match between Figma and Webflow output. "Match" means correct HTML structure, class naming, content, and styles — evaluated via Playwright screenshot comparison with a configurable pixel-diff threshold (since browser rendering inherently differs from Figma).

**Target user:** Developer (CLI/Claude Code interface, manual triggers).

**POC scope:** One component — build a single `two-img-imba` section from Figma to Webflow as the first end-to-end test. This proves the full loop (read, build, test, iterate) before scaling to full pages.

## Why This Approach

**Single-agent over multi-agent because:**
- Need to discover Webflow MCP capabilities first (what it can/can't do)
- Faster feedback loops — one context window sees Figma spec, Webflow output, and visual diff
- CEDOE orchestration adds overhead without payoff until operations are stable
- Can promote to multi-agent later once the exact MCP calls are known

## Class Naming & HTML Conventions

The automation must follow these conventions when creating Webflow elements:

### Client-First Naming (adapted)
- **Section wrapper:** `section_component-name` (e.g., `section_two-img-imba`)
- **Component elements:** `component-name_element` with underscore separator (e.g., `two-img-imba_small-side`, `two-img-imba_header`)
- **Modifiers:** `is-` prefix (e.g., `is-2`, `is-animated`, `is-link`, `is-decor`)
- **Utilities:** `u-image`, `padding-global`, `padding-section-xl`, `container-xl`, `heading-style-h2`, `text-rich-text`
- **Responsive modifiers:** prefix pattern like `mob-is-top-none`

### Semantic HTML
- `<section>` for page sections
- `<article>` for component wrappers (not divs)
- `<figure>` for images
- `<header>` for heading areas
- `<footer>` for CTA areas
- Proper heading hierarchy (`<h1>`, `<h2>`, etc.)

### Accessibility
- `aria-label` on headings and text elements with full readable text
- GSAP SplitText handles word-by-word splitting at runtime with `aria-hidden="true"` — the automation does NOT create these split divs

### What the automation handles vs. what GSAP handles
- **Automation:** HTML structure, class names, content, images, links, custom data attributes, semantic elements
- **GSAP (runtime):** Text splitting animations, clip-path reveals, scroll-triggered effects, `data-animation-general`, `data-animation-order` sequencing

### Other patterns
- `data-eapps-font-size` / `data-eapps-line-height` — responsive font scaling system
- `button-function` / `button-function-arg1` / `button-function-arg2` — custom button behavior attributes
- `mq="mob"` / `mq="desk"` — responsive visibility attributes
- Component variants via `is-` modifier reuse, not separate components
- `container-xl` + `padding-global` + `padding-section-xl` layout system

## Key Decisions

1. **Single-agent pipeline** — Claude Code orchestrates Figma MCP, Webflow MCP, and Playwright in one session
2. **Visual match target** — Playwright screenshot comparison with pixel-diff threshold (not literal pixel identity, since browser ≠ Figma rendering)
3. **Configurable mismatch handling** — Default to auto-iterate, switchable to manual review per run
4. **Convention-driven output** — CLAUDE.md will encode class naming rules so the agent follows them consistently
5. **GSAP is out of scope** — Automation produces clean HTML structure; animations are a separate layer
6. **Existing site + Figma file** as test case — not starting from a template

## Tools & Infrastructure

| Tool | Role |
|------|------|
| Figma MCP | Read design specs (layout, colors, typography, spacing, content) |
| Webflow MCP | Create/update pages, elements, styles, CMS items |
| Playwright | Screenshot live Webflow pages, visual diff comparison |
| Claude Code | Orchestrator — reads Figma, builds Webflow, analyzes diffs, iterates |
| CLAUDE.md | Convention rules (class naming, semantic HTML, accessibility patterns) |

## Resolved Questions

1. **Visual diff tooling** — Both combined: Playwright `toHaveScreenshot()` for automated pass/fail, then Claude analyzes failures to decide what Webflow MCP adjustments to make.
2. **Iteration max retries** — 5 attempts before flagging for manual review.
3. **MCP capability discovery** — Discover as we go. First step of the project is probing what Webflow MCP can/can't do (nested elements, custom attributes, asset uploads).

## Open Questions (to discover during implementation)

1. **Webflow MCP element creation depth** — Can it create nested structures with the specificity needed (e.g., `<article>` > `<figure>` > `<img>` with correct classes and custom attributes)?
2. **Webflow MCP custom attributes** — Can it set `data-*` attributes, `mq` attributes, `button-function` attributes?
3. **Style mapping** — How do Figma design tokens (colors, fonts, spacing) map to Webflow style classes?
4. **Image handling** — Does Webflow MCP support asset upload, or do images need separate upload?
