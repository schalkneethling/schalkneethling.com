# Project doc cache

This directory contains manually refreshed snapshots of public project
`GOAL.md` and `ROADMAP.md` documents.

Refresh the cache with:

```sh
pnpm run refresh:project-docs
```

The refresh is intentionally not part of the build. Public project pages should
continue to use editorial summaries, with this cache available as source
material for future updates.
