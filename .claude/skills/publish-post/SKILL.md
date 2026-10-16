---
name: publish-post
description: Publish a finished blog post draft from src/content/drafts to the live schalkneethling.com site. Use when the author asks to publish, ship, release, or make live a draft post, or to prepare a draft for publishing.
---

# Publish a post

Read [docs/publishing-posts.md](../../../docs/publishing-posts.md) in full and
follow it exactly. It is the single source of truth for this procedure; this
skill only summarizes it.

The procedure, in order:

1. Identify the draft slug the author named in `src/content/drafts/`. Ask if
   it is ambiguous.
2. Start a `post-<slug>` branch from an up-to-date `main`, unless the
   environment assigns a branch.
3. Run `pnpm post:publish <slug>` and show the dry-run output.
4. Run `pnpm post:publish <slug> --write`.
5. Stage the drafts and posts directories and confirm with
   `git diff --cached -M` that the change is a rename with only `pubDate`
   changed.
6. Run `pnpm post:verify <slug>`. If it cannot run, say so; do not claim the
   post is verified.
7. Commit as `post: <title>`, push, and open a pull request.
8. Merge only when the author explicitly asked for the post to be published or
   made live and every pull request check has passed. Otherwise report the
   pull request link and stop.

Never edit the post's content while publishing, never bypass a failing check,
and stop at the first failure with a clear report.
