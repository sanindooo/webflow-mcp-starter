---
name: Button class structure
description: Use base .button class with combo modifier classes (.is-secondary, .is-ghost, .is-outline) instead of separate button-primary/secondary/ghost/outline classes
type: feedback
---

Use a single `.button` base class containing all shared button properties (padding, font-size, font-weight, border-radius, cursor, display, text-decoration). Then use combo modifier classes for variants:
- `.button` alone = primary (default)
- `.button.is-secondary` = secondary variant
- `.button.is-ghost` = ghost variant
- `.button.is-outline` = outline variant

**Why:** More scalable and consistent — shared properties only need updating in one place. Follows Client-First modifier pattern with `is-` prefix.

**How to apply:** When creating button styles in Webflow, create `button` as the base class, then `is-secondary`, `is-ghost`, `is-outline` as combo classes with `parent_style_name: "button"`. Update style-guide.md reference doc accordingly.
