# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server at localhost:4321 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Preview build locally before deploying |
| `npx playwright test` | Run accessibility tests using Playwright |

## Project Architecture

This is an Astro-based personal blog and website with the following key architectural elements:

### Framework & Build

- **Astro 5.x** with MDX integration for content authoring
- TypeScript configuration with strict type checking
- Static site generation targeting production deployment

### Content Management

- **Content Collections**: Blog posts defined in `src/content/posts/` with schema validation
- **Frontmatter Schema**: Posts require title, pubDate, description, author, tags (defined in `src/content/config.ts`)
- **Mixed Content Types**: `.md` and `.mdx` files supported for posts

### Component Architecture

- **Layouts**: `BaseLayout.astro` (main site wrapper), `MarkdownPostLayout.astro` (blog posts)
- **Modular Components**: Organized by feature areas:
  - `Header/` - Navigation, hamburger menu, theme toggle
  - `Home/` - Homepage-specific components (hero, featured content, collective)
  - `Now/` - "Now" page components for current activities
- **Reusable Components**: Picture, Video, Tags, Social, Posts listing

### Styling System

- **Custom CSS Framework**: "Minimalist" design system in `src/styles/minimalist/` - DO NOT EDIT
- **Atomic Design**: Components split into atoms (buttons, forms, typography), utilities, and tokens
- **Design Tokens**: Centralized in `design-tokens/` and processed via Terrazzo config
- **Global Styles**: Combined in `src/styles/global.css`

### Testing & Quality

- **Playwright Tests**: Accessibility-focused testing with custom axe-core integration
- **Custom Reporter**: `tests/reporter/axe-aggregate-reporter.ts` for accessibility test results
- **Test Configuration**: Only runs on Chromium, focuses on a11y compliance

### Key Patterns

- **Dynamic Routes**: `[...slug].astro` for blog post routing, `[tag].astro` for tag pages
- **RSS Generation**: Automated feed generation in `rss.xml.js`
- **Asset Management**: Static assets in `public/`, organized by content type
- **Content Validation**: Zod schemas ensure content structure consistency

The site emphasizes accessibility, performance, and maintainable content authoring workflows.
