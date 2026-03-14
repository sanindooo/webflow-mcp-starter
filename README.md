# Figma-to-Webflow Pipeline

Automated design-to-build pipeline using **Claude Code**, **Figma MCP**, **Webflow MCP**, and **Playwright** visual testing.

Extracts designs from Figma, builds them in Webflow, captures screenshots, compares visually, and iterates until the output matches the design.

## How It Works

```
Figma Design → Extract Tokens → Sync to Webflow → Build Components → Screenshot → Compare → Iterate
```

1. **Verify** — Confirm the Webflow project has a `/style-guide` page (Relume template)
2. **Sync Tokens** — Extract Figma design tokens and update Webflow variables/styles
3. **Read** — Extract component specs from Figma via MCP
4. **Build** — Create elements in Webflow Designer via MCP
5. **Capture** — Playwright screenshots the live page at 1440x900
6. **Compare** — Claude vision compares Figma reference vs Webflow screenshot
7. **Iterate** — Fix issues, re-capture, re-compare (max 5 loops)

## Prerequisites

- [Claude Code](https://claude.com/claude-code) CLI installed
- [Webflow MCP](https://docs.webflow.com/docs/mcp) companion app running
- [Figma MCP](https://github.com/nicholasgriffintn/figma-mcp) configured
- Node.js 18+

## Setup

1. **Use this template** — click "Use this template" on GitHub

2. **Install dependencies:**
   ```bash
   pnpm install
   pnpm run setup  # installs Playwright browsers
   ```

3. **Configure your site URL:**
   ```bash
   cp .env.example .env
   # Edit .env with your Webflow site URL
   ```

4. **Prepare your Webflow project:**
   - Clone the [Relume starter template](https://webflow.com/made-in-webflow/website/relume-library-styleguide) into your Webflow site
   - This provides the `/style-guide` page with form elements, rich text blocks, and foundational styles the automation needs

5. **Connect MCP servers:**
   - Open Webflow Designer with the MCP companion app active
   - Configure Figma MCP with your API key

6. **Start building:**
   ```bash
   claude
   # Then: /build-component
   ```

## Commands

| Command | Description |
|---|---|
| `/build-component` | Full pipeline — Figma design to Webflow build with visual verification |
| `pnpm test:capture` | Capture screenshots of Webflow pages |
| `pnpm test:regression` | Run visual regression tests against baselines |
| `pnpm test:update-baseline` | Update screenshot baselines |

## Project Structure

```
├── .claude/skills/         # Claude Code skills (pipeline orchestration)
│   └── build-component/    # Main Figma-to-Webflow pipeline skill
├── docs/
│   ├── reference/          # Token definitions, breakpoints, component patterns
│   ├── brainstorms/        # Design decision records
│   ├── plans/              # Implementation plans
│   └── component-maps/     # Per-component build specs (generated)
├── tests/visual/           # Playwright visual regression tests
├── test-results/           # Screenshots (gitignored)
├── CLAUDE.md               # Project conventions for Claude Code
├── playwright.config.ts    # Visual test configuration
└── package.json
```

## Key Conventions

- **Naming:** Client-First adapted — `section_component`, `component_element`, `is-modifier`
- **Buttons:** Base `.button` class + combo modifiers (`is-secondary`, `is-ghost`, `is-outline`, etc.)
- **Units:** All sizes in `rem`, longhand CSS only
- **Variables:** Colours and spacing managed via Webflow variable collections
- **Style Guide:** Relume template synced with Figma tokens — not generated from scratch

See [CLAUDE.md](CLAUDE.md) for full conventions and [docs/reference/style-guide.md](docs/reference/style-guide.md) for token definitions.

## Webflow MCP Limitations

The MCP cannot:
- Style rich text children (nested All H2s, All Paragraphs, etc.)
- Create real form elements (FormInput, FormTextarea, FormSelect)
- Edit content inside RichText blocks

This is why the Style Guide page must come from a template (Relume) rather than being generated.

## License

MIT
