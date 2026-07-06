---
name: what-i-want-to-exist-projects
description: Use when adding, updating, or reviewing entries for the schalkneethling.com "What I want to exist" projects area, including project cards, project detail pages, repo doc cache refreshes, GOAL.md/ROADMAP.md links, and the little demos section.
---

# What I Want To Exist Projects

Use this skill for changes under `src/content/projects/`, `src/pages/projects*`,
`src/components/Projects/`, `src/data/project-doc-cache/`, or tests that protect
the curated project listing and detail pages.

## Workflow

1. Read the current project entry or nearby entries in `src/content/projects/`.
2. If adding or materially updating a project, inspect the repo, cached docs, and
   public project page context before writing summaries.
3. Keep public page copy editorial: summarize `GOAL.md`, `ROADMAP.md`, issues,
   and repo docs instead of pasting long verbatim source text.
4. Preserve the current card/detail conventions:
   - `/projects` remains the listing URL.
   - Cards link to internal `/projects/{slug}` pages.
   - Every card needs an `imageUrl`.
   - `category: "main"` appears in the Projects section.
   - `category: "demo"` appears in Little demos.
5. Update tests before implementation when behavior or required content changes.
6. Run the narrow relevant tests first, then the site checks listed below.

## Adding Or Updating A Project

For schema details and a frontmatter checklist, read
`references/project-entry.md`.

Use the project slug as the filename in `src/content/projects/{slug}.md`.
Keep ordering deliberate. Do not automate project ordering unless the user asks.

If repo docs changed, run:

```sh
pnpm run refresh:project-docs
```

Review the generated cache diff under `src/data/project-doc-cache/`. The cache
is source material for editorial summaries, not content rendered directly into
the public pages.

## Validation

Run the smallest meaningful test first. Common commands:

```sh
pnpm exec vitest run tests/projectContent.test.ts
pnpm exec vitest run tests/projectFilters.test.ts tests/projectPages.test.ts
pnpm exec vitest run tests/projectDocCache.test.ts
pnpm exec vitest run tests/projectSkill.test.ts
pnpm run typecheck
pnpm run build
pnpm run test:a11y
```

For listing or detail page UI changes, include the relevant Playwright coverage
in `tests/projects.spec.ts` and verify accessibility.
