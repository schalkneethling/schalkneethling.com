# My Musings and Writing - schalkneethling.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/ab99bc54-9a7a-4cdc-8907-c8105deb01bd/deploy-status)](https://app.netlify.com/sites/schalkneethling-com/deploys)

This is the code for my personal blog where I write about my thoughts, experiences, and learnings. I use this blog as a way to document my journey and share my knowledge with others.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                       | Action                                           |
| :---------------------------- | :----------------------------------------------- |
| `pnpm install`                | Installs dependencies                            |
| `pnpm dev`                    | Starts local dev server at `localhost:4321`      |
| `pnpm run generate:og`        | Generates per-post Open Graph card images        |
| `pnpm run build`              | Generates Open Graph cards and builds to `dist/` |
| `pnpm preview`                | Preview your build locally, before deploying     |
| `pnpm run typecheck`          | Typecheck the project with `astro check`         |
| `pnpm run test:a11y`          | Run Playwright axe accessibility tests           |
| `pnpm run a11y:viewer`        | Open the generated axe aggregate report viewer   |
| `pnpm standard-site:validate` | Build and validate Standard.site discovery links |
| `pnpm astro ...`              | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help`        | Get help using the Astro CLI                     |

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

## Standard.site

The blog is adopting [Standard.site](https://standard.site/) as an AT Protocol
metadata, discovery, and verification layer. The website remains the canonical
reading experience.

See the [Standard.site adoption policy](docs/standard-site-adoption.md) for
content eligibility, rollout, record storage, safeguards, and the scope of the
initial integration phases. The
[publishing and authentication workflow](docs/standard-site-publishing-workflow.md)
records how the site will generate and safely synchronize AT Protocol records.

### Publishing a new post

Publishing to the website is unchanged unless a post opts into Standard.site.
Write the post, open a pull request, merge it, and allow the canonical page to
deploy as before.

To publish the post to Standard.site as well:

1. Add the explicit selection to the post frontmatter:

   ```yaml
   standardSite:
     publish: true
   ```

2. Include that selection in the post pull request, merge it, and allow the
   canonical page to deploy.
3. From an updated `main`, inspect the offline plan:

   ```sh
   pnpm standard-site:generate
   ```

4. Run the authenticated, read-only preflight:

   ```sh
   pnpm standard-site:sync
   ```

5. Create the document record explicitly:

   ```sh
   pnpm standard-site:sync --write
   ```

   Write mode persists the returned `documentAtUri` in the post frontmatter.
   Commit that one-line identifier change in a small follow-up pull request.

6. After the identifier pull request deploys, validate the production post with
   the [Standard.site Validator](https://site-validator.fly.dev/).

The current workflow creates new document records but does not update an
existing record after post content changes. Until document updates are
implemented, edit the website normally and treat its canonical page as the
authoritative version.

### Validation and inspection

Run the complete local pre-deploy validation with:

```sh
pnpm standard-site:validate
```

This command builds the site and checks:

- every rendered HTML page, excluding redirects, includes the configured
  publication discovery link;
- `/.well-known/site.standard.publication` contains the configured publication
  AT-URI;
- every post with `standardSite.documentAtUri` emits exactly one matching
  `site.standard.document` link; and
- no built document link exists without matching post metadata.

The command is local, read-only, and does not load AT Protocol credentials.

Use `pnpm standard-site:generate` for an offline create/update/skip plan. Use
`pnpm standard-site:sync` when an authenticated, read-only check of the remote
records and their content identifiers is required. Only the explicit
`--write` mode performs remote writes.

After deployment:

1. Confirm
   [`/.well-known/site.standard.publication`](https://schalkneethling.com/.well-known/site.standard.publication)
   returns the configured publication AT-URI.
2. Paste a published post URL into the
   [Standard.site Validator](https://site-validator.fly.dev/).
3. Run `pnpm standard-site:sync` and confirm the publication and configured
   documents report `status: "found"` with content identifiers.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
