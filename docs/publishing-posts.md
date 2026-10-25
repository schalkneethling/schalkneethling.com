# Publishing a post

This document is the single procedure for taking a post from draft to the live
site. It applies equally when you run it yourself from a terminal and when you
ask a coding agent to do it. Agents must follow it exactly, and the
[publish-post skill](../.claude/skills/publish-post/SKILL.md) points here.

## How drafts and published posts differ

Drafts live in `src/content/drafts/`. That directory is not part of any content
collection, so a draft is never built, listed, or added to the RSS feed, even
when it is merged to `main`. Writing and revising a post, with or without an
agent, happens entirely in that directory.

Published posts live in `src/content/posts/`. A post becomes visible on the
site when it is in that directory on `main`, its frontmatter satisfies the
posts schema in `src/lib/postSchema.ts`, its `pubDate` is not after the build
time, and Netlify has deployed the resulting build.

Publishing is therefore a mechanical promotion: the draft moves from one
directory to the other and receives its publication date. Nothing else about
the content changes during publishing. If the post needs another edit, make it
in the draft first and publish afterwards.

## Before you publish

Decide whether the post should also be published to Standard.site. If it
should, add the selection to the draft frontmatter before publishing:

```yaml
standardSite:
  publish: true
```

The Standard.site record is created after the post is live, as described in
the [README](../README.md#standardsite).

## Publishing from the terminal

Start from an up-to-date `main` and create a branch for the post:

```sh
git switch main
git pull
git switch -c post-<slug>
```

Preview the promotion. This is a dry run that changes no files:

```sh
pnpm post:publish <slug>
```

The command resolves the draft, sets `pubDate` to today's date in UTC, and
validates the result against the same schema the build uses. It refuses to
continue when the frontmatter is invalid, the draft has no body, a post with
the same slug already exists, or the publication date is after the current UTC
time. That last check exists because the site only lists posts whose
`pubDate` has passed when the build runs, and a post dated in the future would
merge successfully but stay invisible until some later deploy. Pass
`--date YYYY-MM-DD` to use a specific date that is today or earlier.

When the plan looks right, apply it:

```sh
pnpm post:publish <slug> --write
```

Confirm that the change is only the promotion. Git should report a rename with
a single changed line, the `pubDate`:

```sh
git add src/content/drafts src/content/posts
git diff --cached -M --stat
git diff --cached -M
```

Run the production build and confirm the post is actually published by it:

```sh
pnpm post:verify <slug>
```

This runs `pnpm run build`, then checks that `dist/posts/<slug>/index.html`
exists and that `dist/rss.xml` links to the post. Continuous integration also
runs a production build on the pull request, but running it locally first
catches a post that would fail on Netlify before you push.

Commit, push, and open the pull request:

```sh
git commit -m "post: <title>"
git push -u origin post-<slug>
gh pr create --fill
```

Wait for the checks, then merge. The repository uses merge commits:

```sh
gh pr checks --watch
gh pr merge --merge
```

## Confirming the post is live

Netlify deploys `main` after the merge. Switch your local checkout to `main`,
pull the merge, clean up the merged post branch with `git trim`, and install
the latest dependencies with `vp i`:

```sh
git switch main
git pull && git trim
vp i
```

Then wait for the deploy and check the live site with one command, passing the
merge commit and the post's slug:

```sh
pnpm post:await-deploy "$(gh pr view post-<slug> --json mergeCommit -q .mergeCommit.oid)" <slug>
```

The command polls `https://schalkneethling.com/version.txt`, which every
build writes with the commit it was built from, until production serves the
merge commit or a later commit that contains it. It waits up to 15 minutes by
default; pass `--timeout-minutes` to change that. It then checks that
`/posts/<slug>/` loads with the post's title, that `/blog`, `/rss.xml` and,
for one of the three newest posts, the homepage link to it, and that a few
existing posts still load. Failed checks are retried twice, 30 seconds apart,
in case the CDN is still serving cached pages.

Every failure is reported as what failed, the likely reason, and the next
step. The most common ones are these:

- **Production still serves an earlier commit.** The Netlify deploy failed or
  is stuck. Check the pull request's Production build job, then the deploy log
  on the [Netlify deploys page](https://app.netlify.com/projects/schalkneethling-com/deploys).
- **The post returns 404.** The `pubDate` was after the build time, or the
  file is not in `src/content/posts/`.
- **A listing does not link to the post.** Run `pnpm post:verify-live <slug>`
  once more to rule out caching, then inspect `getPublishedPosts` and the
  listing component.
- **An existing post fails.** The deploy regressed existing posts. Republish
  the previous deploy in Netlify to roll back, then investigate.

If the deploy already finished, `pnpm post:verify-live <slug>` runs the same
checks without waiting.

## Asking an agent to publish

Ask with the draft's slug, for example "publish the post
vitest4-do-mock-factories". The agent follows the terminal procedure above,
with these guardrails:

1. Publish only the draft that was named. If the request is ambiguous, ask.
2. Do not edit the post's content, title, description, or tags while
   publishing. Report anything that looks wrong and stop.
3. Run the dry run first and show its output before running `--write`.
4. Confirm the staged diff is a rename with only the `pubDate` line changed.
5. Run `pnpm post:verify <slug>`. If it cannot run, for example because the
   environment has no Playwright Chromium for the Open Graph cards, say so
   explicitly rather than reporting the post as verified.
6. Stop at the first failing step and report it. Never bypass a failing check,
   skip a hook, or change tests to get a step to pass.
7. Before opening the pull request, have a separate agent review the post
   as written, using an Opus model at medium effort. The review looks for
   factual errors, claims the post does not support, broken links, and
   anything a reader would trip over. Report its findings to the author.
   Changing the content because of a finding needs the author's approval,
   as guardrail 2 says.
8. Open the pull request with whatever GitHub tooling the environment
   provides. Use the `post-<slug>` branch name unless the environment assigns
   a branch.
9. Merge as soon as every check on the pull request has passed, every review
   thread is resolved, and the pull request contains nothing except the post.
   The author does not need to approve the merge separately. Otherwise stop
   at the open pull request and report its link.
10. After merging, switch the local checkout to `main` and run
    `git pull && git trim`, then `vp i` to install the latest dependencies.
    If `git trim` is not installed, say so rather than deleting branches
    another way. Where `vp` is not available, run `pnpm install` instead.
    Then run
    `pnpm post:await-deploy <merge-commit> <slug>` in the background and keep
    working or end the turn while it waits. Report its
    result: the live URL when it passes, or each failure as what failed, the
    likely reason, and the next step, exactly as the command prints them.
11. If the command reports that the site cannot be reached, the agent's
    environment has no network access to schalkneethling.com. Say so, do not
    report the post as live, and give the author the exact command to run
    themselves.
12. When the draft opted in, remind the author that the Standard.site record is
    created separately, after the post is live.
