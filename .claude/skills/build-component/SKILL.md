---
name: build-component
description: >
  Orchestrates the full Figma-to-Webflow pipeline. Extracts design from Figma,
  builds in Webflow Designer, runs quality checks, publishes, captures screenshots,
  compares visually, and iterates until the output matches. Use when building a
  component from a Figma design into a live Webflow page. Triggers on "build
  component", "Figma to Webflow", "build from design", or when user provides a
  Figma URL with a Webflow target.
allowed-tools:
  - mcp__figma__get_design_context
  - mcp__figma__get_metadata
  - mcp__figma__get_variable_defs
  - mcp__figma__get_screenshot
  - mcp__webflow__webflow_guide_tool
  - mcp__webflow__data_sites_tool
  - mcp__webflow__de_page_tool
  - mcp__webflow__element_builder
  - mcp__webflow__element_tool
  - mcp__webflow__element_snapshot_tool
  - mcp__webflow__style_tool
  - mcp__webflow__variable_tool
  - mcp__webflow__asset_tool
  - mcp__webflow__de_learn_more_about_styles
  - mcp__webflow__de_component_tool
  - mcp__webflow__data_cms_tool
  - mcp__webflow__data_pages_tool
  - mcp__webflow__data_scripts_tool
  - mcp__webflow__get_image_preview
  - "Bash(npx playwright:*)"
  - "Bash(pnpm test:*)"
  - "Bash(playwright test:*)"
  - "Bash(sleep:*)"
  - "Bash(mkdir:*)"
  - "Bash(curl:*)"
  - Read
  - "Write(/Users/sanindo/webflow-mcp-test/test-results/**)"
  - "Write(/Users/sanindo/webflow-mcp-test/docs/**)"
  - "Write(/Users/sanindo/webflow-mcp-test/tests/**)"
  - Glob
  - Grep
  - Agent
  - Skill
---

# Build Component: Figma-to-Webflow Pipeline

You are an orchestration agent that drives the complete Figma-to-Webflow build
pipeline. You chain Figma MCP, Webflow MCP, webflow-skills, and Playwright
into an automated loop that builds, verifies, publishes, compares, and iterates.

## Before You Start

**Read these reference files** — they define how to build:
- `docs/reference/component-patterns.md` — semantic HTML, Client-First naming, element_builder schemas
- `docs/reference/breakpoints.md` — responsive building rules, spacing/typography scales
- `docs/reference/style-guide.md` — default typography, colour, spacing, and button tokens
- `CLAUDE.md` — full project conventions

## Phase 1: Input Gathering

Collect these inputs. Ask for any that are missing:

| Input | Required | Example |
|---|---|---|
| Figma file URL (with node ID) | Yes | `figma.com/design/ABC123/File?node-id=1:234` |
| Target Webflow site name | Yes | `stephens-mcp-test` |
| Target page slug | Yes | `/poc-test` (existing) or `/new-page` (create) |
| Component name | Yes | `two-img-imba` (used for class naming) |

Parse the Figma URL to extract `fileKey` and `nodeId`:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` (convert `-` to `:` in nodeId)
- Branch URLs: `figma.com/design/:fileKey/branch/:branchKey/:fileName` (use branchKey)

## Phase 2: Setup

1. **Call `webflow_guide_tool`** — always first, every session.
   Context: "Retrieving Webflow MCP best practices before starting component build pipeline for design-to-code automation."

2. **List sites and confirm target:**
   ```
   data_sites_tool → list_sites
   ```
   Context: "Listing all accessible Webflow sites to identify and confirm the target site for component building."
   Confirm the site name with the user. Store the `siteId`.

3. **Switch to target page:**
   ```
   de_page_tool → switch_page (pageId or slug)
   ```
   If the page doesn't exist, create it first with `de_page_tool → create_page`.

4. **Verify Designer connection:**
   Attempt a test call: `element_tool → get_all_elements`.
   If it fails, inform the user:
   ```
   Designer Connection Required:
   1. Open Webflow Designer at stephens-mcp-test.design.webflow.com
   2. Ensure the MCP Companion App is running (green indicator)
   3. Navigate to the target page
   4. Retry
   ```

## Phase 2.5: Style Guide Generation

**Purpose:** Ensure foundational styles (typography, colours, buttons) and design variables exist in Webflow before any component is built. Runs automatically on every `/build-component` invocation but skips creation for anything that already exists (idempotent).

**Context protection:** This phase involves many MCP calls (~40-60). Consider running it in an Agent sub-task to protect the main context window. The sub-agent should return a summary of what was created vs skipped.

### Step 2.5.0: Detect Existing Styles & Variables

Check what already exists in Webflow:

```
1. style_tool → get_styles (query: "all", skip_properties: true)
   Context: "Querying all existing styles to determine which foundational typography and button styles need to be created."

2. variable_tool → get_variable_collections (query: "all")
   Context: "Listing all variable collections to check if Colors and Spacing token collections already exist."

3. de_page_tool → list pages, check for "/style-guide"
   Context: "Checking if a Style Guide page already exists to avoid duplicate page creation."
```

**Skip logic:**
- If styles contain `heading-style-h1` AND variables contain `Colors` collection AND `/style-guide` page exists → **skip Phase 2.5 entirely**
- If partial → continue, creating only what's missing
- Track which items exist to skip individually in subsequent steps

### Step 2.5.1: Determine Token Source

**Priority 1 — Figma style guide frame:**
```
IF Figma fileKey was provided in Phase 1:
  Call get_metadata(fileKey) to list top-level frames
  Context: "Searching for a Style Guide frame in the Figma file to extract design tokens for foundational styles."

  Search for a frame named "Style Guide" (case-insensitive)

  IF found:
    Call get_design_context(fileKey, styleGuideNodeId)
    Context: "Extracting typography, colour, and button tokens from the Figma Style Guide frame."

    Parse extracted tokens:
    - Colours → map to colour variable names
    - Typography → map to heading-style-h1 through h6 + text sizes
    - Buttons → map to button-primary/secondary/ghost/outline
    Save extracted tokens for use in Steps 2.5.2-2.5.4
```

**Priority 2 — Fallback to reference doc:**
```
IF no Figma style guide frame found (or no Figma URL provided):
  Read docs/reference/style-guide.md
  Use the default token values defined there
```

### Step 2.5.2: Create Variables

**Order:** Collections first, then variables within each collection. Track returned variable IDs — they are needed for `variable_as_value` when creating styles in Step 2.5.3.

```
1. Create "Colors" variable collection (if not exists):
   variable_tool → create_variable_collection
   Context: "Creating the Colors variable collection to store brand, neutral, and semantic colour design tokens."

2. Create each colour variable (skip if name already exists in collection):
   variable_tool → create_color_variable (one per call)
   Context: "Creating the [variable-name] colour variable in the Colors collection for site-wide design consistency."

   Variables to create (from style-guide.md or Figma):
   - color-primary (#1A1A2E)
   - color-secondary (#16213E)
   - color-accent (#0F3460)
   - color-neutral-900 (#111111)
   - color-neutral-700 (#333333)
   - color-neutral-500 (#666666)
   - color-neutral-300 (#CCCCCC)
   - color-neutral-100 (#F5F5F5)
   - color-neutral-0 (#FFFFFF)
   - color-success (#22C55E)
   - color-error (#EF4444)
   - color-warning (#F59E0B)
   - color-info (#3B82F6)

3. Create "Spacing" variable collection (if not exists):
   variable_tool → create_variable_collection
   Context: "Creating the Spacing variable collection to store spacing design tokens used across all components."

4. Create each spacing variable (skip if name already exists):
   variable_tool → create_size_variable (one per call)
   Context: "Creating the [variable-name] spacing variable for consistent spacing across the site."

   Variables to create (from style-guide.md or Figma):
   - spacing-xxl (128px)
   - spacing-xl (80px)
   - spacing-lg (64px)
   - spacing-md (40px)
   - spacing-sm (24px)
   - spacing-xs (16px)
   - spacing-xxs (8px)
```

**Batching note:** Create one variable per `variable_tool` call until batch limits are confirmed via spike testing.

### Step 2.5.3: Create Styles

**Order:** Typography first (headings, then text), then buttons.

**For each heading style (h1-h6):**
```
1. create_style (main breakpoint):
   style_tool → create_style
   Context: "Creating the [style-name] typography class with desktop font-size, line-height, and font-weight."

   Properties (3 per call):
   - font-size: [value from token source]
   - line-height: [value]
   - font-weight: [value]

   If colour variable ID is available, add in a second call:
   - color: variable_as_value → [color-neutral-900 variable ID]

2. update_style at "medium" breakpoint (font-size override only):
   style_tool → update_style
   Context: "Applying tablet breakpoint font-size override for [style-name] responsive typography scaling."

3. update_style at "small" breakpoint:
   Context: "Applying mobile landscape font-size override for [style-name] responsive typography scaling."

4. update_style at "tiny" breakpoint:
   Context: "Applying mobile portrait font-size override for [style-name] responsive typography scaling."
```

Skip breakpoint overrides where the value is the same as the inherited value (e.g., `text-size-medium` stays at 1rem across all breakpoints).

**For text styles (text-size-large, text-size-medium, text-size-small, text-rich-text):**
Same pattern as headings. Only override at breakpoints where the value differs.

**For button styles (button-primary, button-secondary, button-ghost, button-outline):**
```
1. create_style (noPseudo):
   style_tool → create_style
   Context: "Creating the [button-name] button style with background, border, padding, and typography properties."

   Properties (batch in 3-4 per call, may need 2 calls):
   Call A: background-color, color, font-weight, font-size
   Call B: padding-top, padding-bottom, padding-left, padding-right
   Call C: border-radius, cursor, text-decoration
   (For bordered buttons: border-top-width, border-top-style, border-top-color, etc.)

2. update_style (hover pseudo):
   style_tool → update_style (pseudo: "hover")
   Context: "Adding hover state styles for [button-name] button interaction feedback."

3. update_style at "medium" breakpoint (min-height: 44px for touch targets):
   Context: "Setting 44px minimum touch target height for [button-name] at tablet breakpoint."
```

**Estimated total calls:** ~6 headings x 4 breakpoints = 24, ~4 text styles x 2 = 8, ~4 buttons x 3 = 12 → ~44 style_tool calls.

### Step 2.5.4: Create Style Guide Page

Create a visible but nav-hidden page that displays all style samples.

```
1. Create the page:
   de_page_tool → create_page
   - title: "Style Guide"
   - slug: "style-guide"
   Context: "Creating a Style Guide reference page to display all foundational typography, colour, and button samples."

2. Build page structure via element_builder (sequential, max 3 levels per call):
```

**Call 1:** Page wrapper
```json
{
  "type": "DivBlock",
  "set_style": { "style_names": ["sg_section", "padding-global"] },
  "children": [
    {
      "type": "DivBlock",
      "set_style": { "style_names": ["container-xl"] },
      "children": [
        {
          "type": "DivBlock",
          "set_style": { "style_names": ["sg_component"] }
        }
      ]
    }
  ]
}
```
Context: "Building the Style Guide page outer shell with padding-global and container-xl wrapper structure."

**Call 2:** Page header (parent: sg_component)
```json
{
  "type": "Heading",
  "set_style": { "style_names": ["heading-style-h1"] },
  "set_heading": { "level": 1 },
  "set_text": { "text": "Style Guide" }
}
```
Context: "Adding the Style Guide page title heading with heading-style-h1 typography class."

**Call 3:** Colours section header + grid (parent: sg_component)
```json
{
  "type": "DivBlock",
  "set_style": { "style_names": ["sg_section-block"] },
  "children": [
    {
      "type": "Heading",
      "set_style": { "style_names": ["heading-style-h2"] },
      "set_heading": { "level": 2 },
      "set_text": { "text": "Colours" }
    },
    {
      "type": "DivBlock",
      "set_style": { "style_names": ["sg_colour-grid"] }
    }
  ]
}
```
Context: "Creating the Colours section with heading and grid container for colour swatch samples."

**Calls 4-6:** Colour swatches (parent: sg_colour-grid, repeat for each colour)
```json
{
  "type": "DivBlock",
  "set_style": { "style_names": ["sg_colour-swatch"] },
  "children": [
    {
      "type": "Paragraph",
      "set_style": { "style_names": ["sg_colour-label"] },
      "set_text": { "text": "color-primary\n#1A1A2E" }
    }
  ]
}
```
Context: "Adding colour swatch sample for [colour-name] to the Style Guide colour grid."

After creating each swatch, apply an inline background-color via `style_tool` using the corresponding variable.

**Call 7:** Typography section (parent: sg_component)
```json
{
  "type": "DivBlock",
  "set_style": { "style_names": ["sg_section-block"] },
  "children": [
    {
      "type": "Heading",
      "set_style": { "style_names": ["heading-style-h2"] },
      "set_heading": { "level": 2 },
      "set_text": { "text": "Typography" }
    },
    {
      "type": "DivBlock",
      "set_style": { "style_names": ["sg_type-samples"] }
    }
  ]
}
```
Context: "Creating the Typography section with heading and container for heading and text samples."

**Calls 8-10:** Typography samples (parent: sg_type-samples)
Add one heading per level (h1-h6) with sample text, then paragraph samples:
```json
{
  "type": "Heading",
  "set_style": { "style_names": ["heading-style-h1"] },
  "set_heading": { "level": 1 },
  "set_text": { "text": "Heading 1 — The quick brown fox" }
}
```
Context: "Adding [heading-level] typography sample to the Style Guide page."

Then text samples:
```json
{
  "type": "Paragraph",
  "set_style": { "style_names": ["text-size-large"] },
  "set_text": { "text": "Large body text. The quick brown fox jumps over the lazy dog." }
}
```

**Call 11:** Buttons section (parent: sg_component)
```json
{
  "type": "DivBlock",
  "set_style": { "style_names": ["sg_section-block"] },
  "children": [
    {
      "type": "Heading",
      "set_style": { "style_names": ["heading-style-h2"] },
      "set_heading": { "level": 2 },
      "set_text": { "text": "Buttons" }
    },
    {
      "type": "DivBlock",
      "set_style": { "style_names": ["sg_button-grid"] }
    }
  ]
}
```
Context: "Creating the Buttons section with heading and grid container for button variant samples."

**Call 12:** Button samples (parent: sg_button-grid)
```json
{
  "type": "Link",
  "set_style": { "style_names": ["button-primary"] },
  "set_text": { "text": "Primary Button" },
  "set_link": { "linkType": "url", "link": "#" }
}
```
Repeat for each button variant (secondary, ghost, outline).
Context: "Adding [button-variant] button sample to the Style Guide buttons grid."

### Step 2.5.5: Style Guide Page Styles

Create the `sg_` prefixed styles for the Style Guide page layout:

| Style | Key Properties |
|---|---|
| `sg_section` | `display: block`, `padding-top: 80px`, `padding-bottom: 80px` |
| `sg_component` | `display: flex`, `flex-direction: column`, `grid-row-gap: 64px` |
| `sg_section-block` | `display: flex`, `flex-direction: column`, `grid-row-gap: 24px` |
| `sg_colour-grid` | `display: grid`, `grid-template-columns: repeat(4, 1fr)`, `grid-column-gap: 16px`, `grid-row-gap: 16px` |
| `sg_colour-swatch` | `padding-top: 40px`, `padding-bottom: 16px`, `padding-left: 16px`, `padding-right: 16px`, `border-radius: 8px` |
| `sg_colour-label` | `font-size: 0.75rem`, `color` → `color-neutral-500` var |
| `sg_type-samples` | `display: flex`, `flex-direction: column`, `grid-row-gap: 16px` |
| `sg_button-grid` | `display: flex`, `flex-direction: row`, `grid-column-gap: 16px`, `align-items: center` |

### Phase 2.5 Summary

After completing Phase 2.5, log a summary:
```
Style Guide Generation Complete:
- Variables: Created X / Skipped Y (already existed)
- Styles: Created X / Skipped Y
- Style Guide page: Created / Already existed
- Token source: Figma / Fallback (docs/reference/style-guide.md)
```

## Phase 3: Read (Figma -> Component Map)

**Context protection:** Run this phase in an Agent sub-task to protect the main context window. The sub-agent should return a structured summary (element tree, key styles, content, attributes) rather than raw Figma data.

**Note:** If Phase 2.5 already extracted Figma tokens (from a Style Guide frame), those tokens are available for reuse. The component-specific extraction here focuses on the component node, not the style guide.

1. **Extract design context:**
   ```
   get_design_context(fileKey, nodeId)
   ```
   This returns: code (React+Tailwind reference), screenshot, and contextual hints.
   Write down all important details — tool results may be cleared later.

2. **Get node hierarchy:**
   ```
   get_metadata(fileKey, nodeId)
   ```
   Understand the full element tree structure.

3. **Get design tokens:**
   ```
   get_variable_defs(fileKey)
   ```
   Extract colors, spacing, typography values.

4. **Save Figma reference screenshot:**
   ```
   get_screenshot(fileKey, nodeId)
   ```
   Save to `test-results/<component>-figma-reference.png`.

5. **Write component map:**
   Create `docs/component-maps/<component>.md` with:

   ```markdown
   # Component: <component-name>

   ## Element Tree
   (ASCII tree showing semantic HTML tags, class names, nesting)

   ## Styles
   (Key CSS properties per class, from Figma tokens)

   ## Content
   (Text content, image URLs, link targets)

   ## Custom Attributes
   (data-animation-*, mq, button-function, aria-label)

   ## Responsive Notes
   (Layout changes at each breakpoint)
   ```

   Reference `docs/reference/component-patterns.md` to map Figma elements
   to the correct semantic HTML tags and Client-First class names.

## Phase 4: Build (Webflow MCP)

Follow the patterns in `docs/reference/component-patterns.md` exactly.

### 4.1 Create Element Structure

Build top-down using `element_builder`. Max 3 nesting levels per call.

**Every section follows the outer shell pattern:**
```
<section> section_<component>       ← Call 1: section > padding-global > container-xl
  <div> padding-global
    <div> container-xl
      <article> <component>_component  ← Call 2: article > child elements
```

**Element type:** Use `type: "DivBlock"` for all container elements. Set semantic HTML tags (section, article, nav, header, footer, figure, ul, li) via the Settings panel Tag dropdown in Webflow Designer after creation.

**Track element IDs** returned from each call — you need them to select parent elements for subsequent calls.

### 4.2 Apply Styles

Use `style_tool` to create and apply styles following Client-First conventions:
- Section wrapper: `section_<component>`
- Component elements: `<component>_<element>`
- Modifiers: `is-<variant>`
- Utility classes: `container-xl`, `padding-global`, `heading-style-h2`, etc.

**Foundational styles** (typography, buttons, colours) should already exist from Phase 2.5. Reference them directly — do not recreate.

Apply responsive styles at each breakpoint per `docs/reference/breakpoints.md`:
- Set desktop styles at `main` breakpoint
- Override at `medium`, `small`, `tiny` only where values differ
- Use longhand CSS properties only
- Batch ~3-4 properties per call

### 4.3 Set Attributes & Content

Use `element_tool` for each element:
- `set_text` — text content
- `set_link` — link href and type
- `set_attributes` — custom attributes (data-animation-general, mq, button-function, aria-label)
- Batch ~3-4 attribute updates per call to avoid timeouts

### 4.4 Decision Points

During the build, evaluate whether additional skills are needed:

**CMS content detected** (e.g., blog posts, team members, products):
1. Invoke `/cms-best-practices` — get architecture guidance
2. Invoke `/cms-collection-setup` — create collections with fields
3. Invoke `/bulk-cms-update` — populate items

**Custom scripts needed** (analytics, tracking, third-party):
1. Invoke `/custom-code-management`

## Phase 5: Verify (Quality Gate)

**Context protection:** Run quality gate checks in an Agent sub-task. The sub-agent should return a pass/fail summary with scores.

Run before the first publish. Skip on subsequent iteration loops.

1. **Site audit:**
   Invoke `/site-audit`
   - If health score < 70: flag critical issues, attempt auto-fix, re-audit

2. **Link checker:**
   Invoke `/link-checker`
   - If broken links found: auto-fix HTTP->HTTPS, flag unfixable ones

3. **Asset audit:**
   Invoke `/asset-audit`
   - If missing alt text: generate and apply descriptive alt text

4. **Accessibility audit** (requires Designer connection):
   Invoke `/accessibility-audit`
   - If critical issues: fix heading hierarchy, missing labels, touch targets

Present quality gate results to the user before proceeding:
```
Quality Gate Results:
- Site audit: PASS (score: 85/100)
- Link checker: PASS (12 links checked, 0 broken)
- Asset audit: PASS (3 images, all have alt text)
- Accessibility: PASS (score: 92/100)

Proceed to publish?
```

## Phase 6: Publish & Capture

1. **Publish:**
   Invoke `/safe-publish` — this runs the plan->confirm->verify workflow.
   The user must confirm before publishing goes live.

2. **Wait for CDN propagation:**
   Poll until the published page returns fresh content (up to 30 seconds):
   ```bash
   for i in 1 2 4 8 15; do curl -s -o /dev/null -w "%{http_code}" "https://<site>.webflow.io/<page>" | grep -q 200 && break; sleep $i; done
   ```
   If polling is not practical, use `sleep 15` as a conservative fallback.

3. **Capture screenshot:**
   ```bash
   pnpm test:capture
   ```
   This runs Playwright at 1440x900 viewport and saves to
   `test-results/<component>-current.png`.

4. **Generate component test** (first iteration only):
   Create `tests/visual/<component>.spec.ts` using the component name, page slug, and root selector. Follow the pattern in existing test files (capture + regression tests).

## Phase 7: Compare

1. **Read both images:**
   - `test-results/<component>-figma-reference.png` (Figma design)
   - `test-results/<component>-current.png` (Webflow screenshot)

2. **Visual comparison** — analyze these dimensions:

   | Dimension | What to Check |
   |---|---|
   | Layout | Element positions, grid/flex structure, alignment |
   | Spacing | Margins, paddings, gaps between elements |
   | Typography | Font size, weight, line-height, color, family |
   | Colors | Backgrounds, borders, text colors, gradients |
   | Content | All text present, images loaded, links correct |
   | Responsive | Correct elements shown/hidden (mq attributes) |

3. **Generate structured diff report:**

   ```
   ## Visual Comparison: <component>

   ### PASS
   - Layout structure matches (2-column with image left, content right)
   - Content is complete (heading, paragraph, CTA all present)
   - Image loaded correctly

   ### FAIL
   - [CRITICAL] Heading font-size is 32px, should be 48px
   - [MODERATE] Section padding-top is 40px, should be 64px
   - [MINOR] CTA button border-radius is 4px, should be 8px
   ```

4. **Decision:**
   - All PASS or only MINOR issues -> **DONE**, report success
   - CRITICAL or MODERATE issues remain -> proceed to **Phase 8: Iterate**
   - `iteration_count >= 5` -> **STOP**, report remaining issues to user

## Phase 8: Iterate (max 5 loops)

Track: `iteration_count`, `fixes_applied[]`, `remaining_issues[]`

For each FAIL item from the diff report:

1. **Determine fix approach:**

   | Issue Type | Fix With |
   |---|---|
   | Element structure (missing/wrong elements) | `element_builder` or `element_tool` |
   | Style issue (spacing, color, font) | `style_tool` → `update_style` |
   | Content issue (wrong text, missing image) | `element_tool` → `set_text`, `set_image` |
   | Attribute issue (missing aria-label, mq) | `element_tool` → `set_attributes` |
   | Link issue (wrong href) | `element_tool` → `set_link` |

2. **Apply fixes** via the appropriate Webflow MCP tool.

3. **After all fixes applied:**
   - Re-publish via `/safe-publish`
   - Wait for CDN (poll or `sleep 15`)
   - Re-capture with `pnpm test:capture`
   - Re-compare (go back to Phase 7)

4. **Increment `iteration_count`**. If >= 5, stop and report.

5. **Post-iteration quality re-check** (after final iteration only):
   When `iteration_count` reaches the max or all issues are resolved, run a lightweight re-check:
   - Invoke `/link-checker` — verify no broken links introduced by fixes
   - Invoke `/accessibility-audit` — verify no a11y regressions
   Report any new issues in Phase 9.

## Error Recovery

If any phase fails, follow these recovery steps:

- **element_builder timeout** — Retry the call once. If it fails again, reduce nesting depth to 2 levels.
- **variable_tool failure** — Log the error. If variable creation fails entirely, fall back to hardcoded hex values in styles (no variable references). Continue with style creation.
- **style_tool failure referencing variable** — If `variable_as_value` fails, retry with hardcoded `property_value` instead. Log that manual variable linking is needed.
- **Phase 2.5 partial completion** — If interrupted mid-phase, the next run's idempotency checks (Step 2.5.0) will detect what exists and create only what's missing. No manual cleanup needed.
- **Publish failure** — Retry once via `/safe-publish`. If it fails again, ask the user to check their Webflow site settings.
- **Screenshot failure** — Increase CDN wait to 20 seconds and retry capture.
- **Skill invocation failure** — Skip the skill, log which one failed, and continue the pipeline. Report skipped skills in Phase 9.
- **Designer connection lost** — Prompt user to reconnect (same as Phase 2 step 4), then resume from the last successful phase.

## Phase 9: Completion Report

When done (either PASS or max iterations reached), present:

```
## Build Complete: <component>

| Metric | Value |
|---|---|
| Iterations | X/5 |
| Fixes applied | Y |
| Quality gate | PASS/FAIL |
| Visual match | PASS / X issues remaining |

### Style Guide
- Token source: Figma / Fallback
- Variables created: X (Colors: Y, Spacing: Z)
- Styles created: X (Typography: Y, Buttons: Z)
- Style Guide page: Created / Already existed

### Files Created
- docs/component-maps/<component>.md
- test-results/<component>-figma-reference.png
- test-results/<component>-current.png

### Quality Gate Results
- Site audit: PASS/FAIL (score)
- Link checker: PASS (X links checked)
- Asset audit: PASS/FAIL (X images)
- Accessibility: PASS/FAIL (score)

### Next Steps
- [ ] Review component in Webflow Designer
- [ ] Set semantic HTML tags via Settings panel (section, article, etc.)
- [ ] Test at all breakpoints (main, medium, small, tiny)
- [ ] Verify animations work with GSAP (not automated)
- [ ] Run `pnpm test:regression` to save baseline for future regression testing
```
