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
7. Have a separate Opus agent at medium effort review the post, and report
   its findings to the author. Content changes need the author's approval.
8. Commit as `post: <title>`, push, and open a pull request.
9. Merge once every pull request check has passed and every review thread is
   resolved. The author does not need to approve the merge separately.
10. After merging, switch to `main`, run `git pull && git trim`, and run
    `vp i` (or `pnpm install` without `vp`). Then run
    `pnpm post:await-deploy <merge-commit> <slug>` in the background and
    report its result. If it cannot reach the site, say so,
    do not call the post live, and give the author the command to run.

Never edit the post's content while publishing, never bypass a failing check,
and stop at the first failure with a clear report.
