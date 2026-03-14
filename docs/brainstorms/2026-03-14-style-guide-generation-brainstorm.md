# Style Guide Generation on Initialisation

**Date:** 2026-03-14
**Status:** Brainstorm complete

## What We're Building

An automatic style guide generation phase that runs at the start of `/build-component` before any elements are created. It ensures that all foundational styles — typography (headings, body text), buttons, colours, and design variables — exist in Webflow before component building begins.

**Scope:**
- Typography styles: heading-style-h1 through h6, body/paragraph text sizes, rich text
- Button styles: primary, secondary, and variant button classes
- Colour variables: brand colours, neutrals, semantic colours (success, error, etc.)
- Spacing/sizing variables: padding and margin tokens used across the system

**Source of truth (priority order):**
1. **Figma style guide** — if the Figma file contains a style guide frame/page, extract tokens from it
2. **Reference doc fallback** — `docs/reference/style-guide.md` provides sensible Client-First defaults when no Figma style guide exists

## Why This Approach

- **Consistency:** Every component build starts from the same foundation, matching Client-First conventions
- **Figma-first:** When designers have defined styles in Figma, those are authoritative — no manual translation needed
- **Idempotent:** Checks if styles/variables already exist before creating, so it's safe to run repeatedly
- **Webflow variables:** Uses the modern Webflow variable system for colours and spacing, enabling easy theme changes site-wide

## Key Decisions

1. **Trigger:** New Phase 2.5 in `/build-component`, between setup (Phase 2) and Figma read (Phase 3). Runs automatically — no separate skill needed.

2. **Detection logic:** Before creating anything, query existing Webflow styles/variables. Skip creation for anything that already exists.

3. **Figma extraction:** Check for a style guide frame in the Figma file. If found, extract typography scales, colour palette, and button patterns via Figma MCP.

4. **Fallback reference doc:** `docs/reference/style-guide.md` contains the default Client-First token set (typography scale from breakpoints.md, standard colour palette, button patterns). Used when Figma has no style guide.

5. **Webflow variables for colours/spacing:** Create design variables via `variable_tool`, then reference them in style definitions. Hardcoded values are not used for anything that can be a variable.

6. **Responsive typography:** Apply the existing breakpoint scale from `docs/reference/breakpoints.md` — desktop sizes cascade down through medium/small/tiny breakpoints.

7. **Batching:** Follow existing MCP limits — max 3-4 properties per `style_tool` call, create variables before styles that reference them.

## Resolved Questions

1. **Button variants** — Match Figma when a style guide exists. Fallback default: primary, secondary, ghost, and outline button styles.

2. **Colour palette defaults** — Minimal semantic set: neutrals (black, white, grey shades) plus semantic colours (success green, error red, warning yellow, info blue). Project-specific brand colours come from Figma.

3. **Style guide page in Webflow** — Yes, create a visible (but hidden from nav) "Style Guide" page in Webflow that displays all typography samples, button variants, and colour swatches. Acts as a living reference inside the Designer.

## Implementation Artifacts

- **Modified:** `skills/build-component/SKILL.md` — add Phase 2.5
- **New:** `docs/reference/style-guide.md` — default token definitions
- **Modified:** `CLAUDE.md` — document new utility classes and variables
