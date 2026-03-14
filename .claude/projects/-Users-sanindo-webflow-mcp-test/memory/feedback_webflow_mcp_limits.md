---
name: Webflow MCP operational limits
description: Known limitations of Webflow MCP for style guide generation — rich text children, form elements, batch limits
type: feedback
---

**Rich text child styling:** The MCP can create combo classes named after rich text child types (All H2s, All Paragraphs, etc.), but cannot actually apply them as rich text nested styles. Rich text child styling must be done manually in the Webflow Designer by selecting elements inside the rich text block. The MCP can only apply a class to the rich text container itself.

**Form elements:** The MCP creates DivBlocks styled to look like inputs/textareas/selects, but cannot create actual Webflow form elements (FormInput, FormTextarea, FormSelect). These need to be added manually or via a template.

**Batch attribute limits:** ~3-4 attribute updates per call to avoid timeouts.

**Publish API quirks:** Publish via `sites-publish` requires waiting for CDN propagation (~15s).

**Longhand CSS only:** No shorthand properties (use padding-top not padding, border-top-width not border-width).

**Why:** These are hard limitations of the Webflow Designer API / MCP integration, not fixable from our side.

**How to apply:** When building style guides, pre-populate elements the MCP can't create (rich text blocks, form elements) by using a template like Relume's style guide. The MCP then modifies variables, classes, and styles on what's already there.
