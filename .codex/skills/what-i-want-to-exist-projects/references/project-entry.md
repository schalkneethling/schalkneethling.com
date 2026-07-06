# Project Entry Reference

Project entries live in `src/content/projects/{slug}.md`.

## Required Frontmatter

- `title`: Display name.
- `description`: Short card summary.
- `category`: `"main"` for Projects or `"demo"` for Little demos.
- `order`: Integer used for deliberate listing order.
- `repoUrl`: GitHub repository URL.
- `imageUrl`: Card/detail visual. Prefer the repo OpenGraph image when present.

## Optional Frontmatter

- `language`: Primary language shown on cards/detail facts.
- `stars`: GitHub star count shown on cards.
- `liveUrl`: Live site or demo URL when available.
- `goalDocUrl`: Public GitHub link to `GOAL.md` when available.
- `roadmapDocUrl`: Public GitHub link to `ROADMAP.md` when available.
- `technologies`: Short list of project technologies.
- `whatAndWhy`: Editorial "what and why" detail-page summary.
- `goalSummary`: Editorial summary of the project goal.
- `currentState`: Where the project is now.
- `nextSteps`: Short list of what comes next.
- `contributionGuidance`: How people can help.

## Content Rules

- Use editorial summaries, not pasted repo docs.
- Keep summaries concrete and written in the site’s voice.
- Prefer links to `GOAL.md` and `ROADMAP.md` over duplicating full documents.
- Make missing docs visible only when useful; do not invent links.
- Keep detail content complete for `category: "main"` starter-style projects.

## Tests To Consider

- `tests/projectContent.test.ts`: required project fields, doc links, live URLs.
- `tests/projectFilters.test.ts`: category grouping and ordering.
- `tests/projectPages.test.ts`: internal project URL helpers.
- `tests/projects.spec.ts`: listing/detail rendering and accessibility-related UI.
