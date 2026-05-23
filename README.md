# My Musings and Writing - schalkneethling.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/ab99bc54-9a7a-4cdc-8907-c8105deb01bd/deploy-status)](https://app.netlify.com/sites/schalkneethling-com/deploys)

This is the code for my personal blog where I write about my thoughts, experiences, and learnings. I use this blog as a way to document my journey and share my knowledge with others.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`            | Installs dependencies                            |
| `pnpm dev`                | Starts local dev server at `localhost:4321`      |
| `pnpm run generate:og`    | Generates per-post Open Graph card images        |
| `pnpm run build`          | Generates Open Graph cards and builds to `dist/` |
| `pnpm preview`            | Preview your build locally, before deploying     |
| `pnpm run typecheck`      | Typecheck the project with `astro check`         |
| `pnpm run test:a11y`      | Run Playwright axe accessibility tests           |
| `pnpm run a11y:viewer`    | Open the generated axe aggregate report viewer   |
| `pnpm astro ...`          | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help`    | Get help using the Astro CLI                     |

## Open Graph cards

Blog post social cards are generated at build time with
[`@schalkneethling/opengraph-cards-maker`](https://github.com/schalkneethling/opengraph-cards-maker).

- Generator script: [`scripts/generate-og-cards.mjs`](scripts/generate-og-cards.mjs)
- Card background artwork: [`src/assets/open-graph/post-card-template.png`](src/assets/open-graph/post-card-template.png)
- Generated source output: `public/og/posts/`
- Built output: `dist/og/posts/`
- Metadata wiring:
  - [`src/pages/posts/[...slug].astro`](src/pages/posts/[...slug].astro)
  - [`src/layouts/MarkdownPostLayout.astro`](src/layouts/MarkdownPostLayout.astro)
  - [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro)

`public/og/` is ignored because the cards are reproducible build output. Run
`pnpm run generate:og` after changing post frontmatter, the generator script, or
the card template. The full `pnpm run build` command runs this automatically.

If the card design needs tuning, the current blog-specific layout is the
`image-panel` layout in
[`@schalkneethling/opengraph-cards-maker`](https://github.com/schalkneethling/opengraph-cards-maker/blob/main/docs/data-model.md#layout-image-panel).
The generator uses `background.src` for the template image and
`contentAlign: "align-end"` so the post text sits on the right while the
background graphic remains on the left.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
