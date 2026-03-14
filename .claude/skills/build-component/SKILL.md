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
  - "Read(/Users/sanindo/webflow-mcp-test/scripts/manifest.json)"
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

## Phase 2.5: Style Guide Verification & Token Sync

**Purpose:** Verify the Webflow project has a Style Guide page with foundational styles, then sync design tokens from Figma to match the project's brand.

**Prerequisite:** The project must already have a `/style-guide` page cloned from the Relume starter template (or a minimal derivative). This page provides elements the MCP cannot create programmatically: rich text blocks with styled children, real form inputs, checkboxes, radios, toggles, etc.

### Step 2.5.0: Verify Style Guide Exists

```
1. de_page_tool → list pages, check for "/style-guide"
   Context: "Checking if the required Style Guide page exists."

2. style_tool → get_styles (query: "all", skip_properties: true)
   Context: "Querying existing styles to understand what the template provides."

3. variable_tool → get_variable_collections (query: "all")
   Context: "Listing existing variable collections — Relume templates ship with their own variables."
```

**Gate check:**
- If `/style-guide` page does NOT exist → **STOP**. Inform the user:
  ```
  Style Guide Required:
  This project needs a /style-guide page before components can be built.
  Please clone from the Relume starter template (or your minimal derivative)
  and run /build-component again.
  ```
- If page exists → continue. Inventory the existing styles and variables.

### Step 2.5.1: Inventory & Map Relume Template

**Context protection:** Run this in an Agent sub-task. The sub-agent queries all variables and styles, then returns a structured mapping table.

```
1. Query all variable collections and their variables:
   variable_tool → get_variable_collections (query: "all")
   For each collection: variable_tool → get variables in collection
   Context: "Inventorying Relume template variables for mapping to project conventions."

2. Build variable mapping using docs/reference/style-guide.md "Relume Template Mapping" section:

   a. Relume "Primitives" collection → map neutral shades to project color-neutral-* names:
      - neutral-white → color-neutral-0
      - neutral-shade-1 → color-neutral-100
      - neutral-shade-2 → color-neutral-300
      - neutral-shade-3 → (keep as primitive, no project equivalent)
      - neutral-shade-4 → color-neutral-500
      - neutral-shade-5 → color-neutral-700
      - neutral-shade-6 → (keep as primitive, no project equivalent)
      - neutral-shade-7 → color-neutral-900

   b. Relume "Typography" collection → note font-style-heading and font-style-body variable IDs

   c. Relume "UI Styles" collection → note radius-large/medium/small and border-width variable IDs

   d. Relume "Color Schemes" collection → note all color-scheme variable IDs
      (These reference primitives — they'll update automatically when primitives change)

3. Query all styles:
   style_tool → get_styles (query: "all", skip_properties: false)
   Context: "Inventorying Relume template styles for mapping."

4. Categorize existing styles:
   a. Typography: heading-style-*, text-size-*, text-weight-*, text-align-*
   b. Buttons: button, is-secondary, is-link, is-text, is-small, is-icon, is-alternate
   c. Forms: form_*, is-text-area, is-select-input
   d. Layout: padding-global, padding-section-*, container-*
   e. Missing from project convention (to create): is-ghost, is-outline, container-xl

5. Return structured mapping_table:
   {
     variables: {
       to_update: [ { relume_id, relume_name, project_name, new_value } ],
       to_create: [ { name, collection, type, value } ]
     },
     styles: {
       to_update: [ { name, properties_to_change } ],
       to_create: [ { name, parent_style, properties } ]
     },
     font_variable_ids: { heading: "...", body: "..." },
     radius_variable_ids: { large: "...", medium: "...", small: "..." }
   }
```

**Key principle:** Prefer updating existing Relume variables/styles over creating new ones. Only create new variables/styles if the template doesn't provide an equivalent.

### Step 2.5.2: Extract Figma Tokens

**Priority 1 — Figma style guide frame:**
```
IF Figma fileKey was provided in Phase 1:
  Call get_metadata(fileKey) to list top-level frames
  Search for a frame named "Style Guide" (case-insensitive)

  IF found:
    Call get_design_context(fileKey, styleGuideNodeId)
    Call get_variable_defs(fileKey)
    Parse extracted tokens:
    - Colours → hex values
    - Typography → font-size, line-height, font-weight per heading level
    - Spacing → values
    Save extracted tokens for use in Step 2.5.3
```

**Priority 2 — Fallback to reference doc:**
```
IF no Figma style guide frame found (or Figma rate-limited):
  Read docs/reference/style-guide.md
  Use the default token values defined there
```

### Step 2.5.3: Sync Variables

Use the mapping_table from Step 2.5.1 and tokens from Step 2.5.2.

**Context protection:** Run in an Agent sub-task (~20-30 variable_tool calls). Return a summary of what was updated/created with all variable IDs.

```
1. Update existing Relume primitives with project palette values:
   For each entry in mapping_table.variables.to_update:
     variable_tool → update_color_variable (or update_size_variable)
     - variable_id: entry.relume_id
     - value: Figma token value (or fallback from style-guide.md)
     Context: "Updating Relume primitive [relume_name] to project value [new_value] for [project_name]."

   Priority order:
   a. Neutral shades (neutral-white through neutral-shade-7)
   b. Font family variables (font-style-heading, font-style-body)
   c. UI variables (radius-large/medium/small)

2. Create missing project variables:
   For each entry in mapping_table.variables.to_create:

   a. Create "Colors" collection (if not exists):
      variable_tool → create_variable_collection (name: "Colors")
      Context: "Creating Colors collection for brand and semantic colour tokens."

   b. Create each colour variable:
      variable_tool → create_color_variable (one per call)
      Variables: color-primary, color-secondary, color-accent,
                 color-success, color-error, color-warning, color-info
      Context: "Creating [variable-name] colour variable."

   c. Create "Spacing" collection (if not exists):
      variable_tool → create_variable_collection (name: "Spacing")
      Context: "Creating Spacing collection for spacing design tokens."

   d. Create each spacing variable:
      variable_tool → create_size_variable (one per call)
      Variables: spacing-xxl (8rem) through spacing-xxs (0.5rem)
      Context: "Creating [variable-name] spacing variable."

3. Track ALL variable IDs (both updated and created):
   Build a variable_id_map: { project_name → variable_id }
   This is needed for variable_as_value when syncing styles.
```

**Error recovery:** If variable_tool fails, fall back to hardcoded hex/rem values in styles (no variable references). Log for manual linking later.

### Step 2.5.4: Sync Styles

**Context protection:** Run in an Agent sub-task (~30-50 style_tool calls). Use the mapping_table from Step 2.5.1, tokens from Step 2.5.2, and variable_id_map from Step 2.5.3.

**Order:** Layout first, then typography, then buttons. Forms last (usually just need variable binding updates).

**1. Layout styles:**
```
a. Update padding-global:
   style_tool → update_style "padding-global"
   Set: padding-left: 2rem, padding-right: 2rem
   (Overrides Relume's default 5%)
   Context: "Updating padding-global from 5% to fixed 2rem."

b. Update padding-section-large/medium/small breakpoint overrides:
   For each size (large/medium/small):
     update_style at "medium" breakpoint with responsive value
     update_style at "small" breakpoint
     update_style at "tiny" breakpoint
   See docs/reference/breakpoints.md for values.
   Context: "Applying responsive overrides for padding-section-[size]."

c. Create container-xl (alias for container-large):
   IF "container-xl" not in existing styles:
     style_tool → create_style "container-xl"
     Properties: max-width: 80rem, margin-left: auto, margin-right: auto
     Context: "Creating container-xl as project alias for container-large."
```

**2. Typography styles:**
```
For each heading style (heading-style-h1 through h6):
  a. update_style with Figma token values:
     - font-size, line-height, font-weight (3 properties per call)
     Context: "Updating [style-name] to match Figma typography tokens."

  b. Bind colour to variable:
     - color: variable_as_value → variable_id_map["color-neutral-900"]
     Context: "Binding [style-name] colour to color-neutral-900 variable."

  c. Apply breakpoint overrides (medium, small, tiny):
     Only where font-size differs from the inherited value.
     Context: "Applying [breakpoint] font-size override for [style-name]."

For each text style (text-size-large, text-size-medium, text-size-small, text-rich-text):
  Same pattern. Bind colour to color-neutral-700.
  Skip breakpoint overrides where value is same across all breakpoints.
```

**3. Button styles:**
```
a. Update base "button" class (already exists in Relume):
   update_style: background-color → variable color-accent, color → variable color-neutral-0
   update_style: font-weight 600, font-size 1rem, border-radius via variable radius-medium
   Context: "Updating button base class with project brand colours."

b. Update "is-secondary" combo class:
   update_style: background-color → variable color-neutral-100, color → variable color-neutral-900
   update_style: border colors → variable color-neutral-300
   Context: "Updating is-secondary button variant colours."

c. Create "is-ghost" combo class (NOT in Relume):
   create_style "is-ghost" with parent_style_name "button":
   Properties: background-color transparent, color → variable color-accent
   Hover pseudo: opacity 0.7
   Context: "Creating is-ghost button variant."

d. Create "is-outline" combo class (NOT in Relume):
   create_style "is-outline" with parent_style_name "button":
   Properties: background-color transparent, color → variable color-accent
   Border: 1px solid → variable color-accent (all 4 sides, longhand)
   Hover pseudo: background-color → variable color-accent, color → variable color-neutral-0
   Context: "Creating is-outline button variant."

e. Apply hover states to base button:
   update_style pseudo "hover": opacity 0.85
   Context: "Adding hover state to button base class."

f. Apply responsive touch targets:
   update_style at "medium" breakpoint: min-height 2.75rem
   Context: "Setting 44px touch target for buttons at tablet."
```

**4. Form styles (light touch):**
```
Relume forms already have proper structure (form_input, form_field-label, etc.).
Only update border/focus colours to use project variables:

a. update_style "form_input":
   border colors → variable color-neutral-300
   Focus pseudo: border colors → variable color-accent
   Context: "Binding form input borders to project colour variables."

b. Repeat for form_textarea and form_select if they exist.
```

Skip breakpoint overrides where the value is the same as the inherited value.

### Step 2.5.5: Verify Rich Text Styling

The Relume template's rich text block should already have styled children (All H2s, All Paragraphs, All Links, etc.). Verify by visual inspection:
- Switch to the style-guide page
- Check that the rich text block renders with proper typography hierarchy

If rich text children need updating, inform the user — this must be done manually in the Designer:
```
Rich Text Children (manual update needed):
- All H2s: font-size 2rem, weight 700, color color-neutral-900
- All Paragraphs: font-size 1rem, line-height 1.6, color color-neutral-700
- All Links: color color-accent, underline
- All Blockquotes: border-left 3px solid color-accent, italic
```

### Phase 2.5 Summary

After completing Phase 2.5, log a summary:
```
Style Guide Sync Complete:
- Template: Relume (or derivative)
- Token source: Figma / Fallback (docs/reference/style-guide.md)
- Variables: Updated X / Created Y / Skipped Z
- Styles: Updated X / Created Y / Skipped Z
- Manual tasks: [list any items requiring Designer interaction]
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

**Custom scripts needed** (animations, analytics, interactions):
1. Read `scripts/manifest.json` to check if the component has an associated script
2. If script exists in manifest → invoke `/custom-code-management` to inject the jsDelivr `<script>` tag on the target page
3. If component needs NEW custom JS → invoke `/custom-code-management` to create the script file, update the manifest, and inject
4. Ensure global scripts (e.g., shared animations) are present at the project level — invoke `/custom-code-management` for idempotent check
5. After injection, inform user to commit, tag, and push if new scripts were created

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
