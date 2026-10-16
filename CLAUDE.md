# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Pull Request Scope

Before scoping an issue or task, starting a new piece of work, or expanding an
implementation beyond its original acceptance criteria, read [PR.md](PR.md).
Use it to keep changes coherent and comfortably reviewable.

## Publishing Posts

Drafts live in `src/content/drafts/` and are never built. When asked to
publish a draft, follow [docs/publishing-posts.md](docs/publishing-posts.md)
exactly: it defines the `pnpm post:publish` and `pnpm post:verify` commands
and the guardrails for merging.

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local dev server at localhost:4321 |
| `pnpm run build` | Generate Open Graph cards and build the production site to ./dist/ |
| `pnpm preview` | Preview build locally before deploying |
| `pnpm run typecheck` | Typecheck the project and validate content with `astro check` |
| `pnpm run test:unit` | Run the Vitest unit tests |
| `pnpm run test:a11y` | Run Playwright browser specs; accessibility-focused specs use axe-core |
| `pnpm post:publish <slug>` | Promote a draft to a published post (dry run unless `--write`) |
| `pnpm post:verify <slug>` | Build and confirm a post is published by the build |

## Project Architecture

This is an Astro-based personal blog and website with the following key architectural elements:

### Framework & Build

- **Astro 7.x** with MDX integration for content authoring
- TypeScript configuration with strict type checking
- Static site generation targeting production deployment

### Content Management

- **Content Collections**: Defined in `src/content.config.ts`. Blog posts live in
  `src/content/posts/` and project entries in `src/content/projects/`, both
  with schema validation. Drafts in `src/content/drafts/` are not a collection
  and are never built.
- **Frontmatter Schema**: Posts require title, pubDate, description, author, tags (defined in `src/lib/postSchema.ts`)
- **Mixed Content Types**: `.md` and `.mdx` files supported for posts

### Component Architecture

- **Layouts**: `BaseLayout.astro` (main site wrapper), `MarkdownPostLayout.astro` (blog posts)
- **Modular Components**: Organized by feature areas:
  - `Header/` - Navigation, hamburger menu, theme toggle
  - `Home/` - Homepage-specific components (hero, featured content, collective)
  - `Projects/` - Project cards and listings
  - `Footer/` - Footer artwork
- **Reusable Components**: Picture, Video, Tags, Social, Posts listing

### Styling System

- **Custom CSS Framework**: "Minimalist" design system in `src/styles/minimalist/` - DO NOT EDIT
- **Atomic Design**: Components split into atoms (buttons, forms, typography), utilities, and tokens
- **Design Tokens**: Centralized in `design-tokens/` and processed via Terrazzo config
- **Global Styles**: Combined in `src/styles/global.css`

### Testing & Quality

- **Unit Tests**: `tests/**/*.test.ts` files use Vitest. Pure utilities and other
  non-browser behavior must not be forced into Playwright or axe-core tests.
- **Browser Tests**: `tests/**/*.spec.ts` files use Playwright. Playwright is
  currently configured to run on Chromium only.
- **Accessibility Tests**: Accessibility-focused Playwright specs use the
  custom axe-core fixture in `tests/fixtures/axe-test-fixture.ts`.
  `@schalkneethling/axe-aggregate-reporter` aggregates their results.
- **Test Selection**: Choose the test runner according to the behavior under
  test. Playwright and axe-core are not required for unit-level data, schema,
  parsing, or utility tests.

### Code Clarity

- Prefer named predicates and intermediate validation results over dense
  compound conditions when they make control flow easier to read and reason
  about.

### Key Patterns

- **Dynamic Routes**: `posts/[...slug].astro` for blog post routing, `tags/[tag].astro` for tag pages, `projects/[slug].astro` for project pages
- **RSS Generation**: Automated feed generation in `src/pages/rss.xml.js`
- **Asset Management**: Static assets in `public/`, organized by content type
- **Content Validation**: Zod schemas ensure content structure consistency

The site emphasizes accessibility, performance, and maintainable content authoring workflows.
