---
title: "Git: Recovering When You Branched From the Wrong Branch"
pubDate: 2026-02-26
description: "A practical walkthrough for when you realise your feature branch was created from the wrong base, covering git log, merge parents, cherry-pick, and bypassing commit hooks."
author: "Schalk Neethling"
tags: ["git", "workflows"]
---

Git is one of those tools where muscle memory carries you far — until it does not. Certain situations come up rarely enough that you never quite memorise the solution, yet when they do appear they are urgent enough that you need to find an answer quickly. Accidentally branching from the wrong base branch is a perfect example.

This post walks through exactly that scenario and shows you how to cleanly recover using `git log`, merge parent references, and `git cherry-pick`.

## The Problem

You have been working on a feature branch and are ready to open a pull request, but then you run `git log` and notice something unexpected:

```bash
git log
commit 15281e5ab5022d8b1e293ce2805abb8b65ee44ad (HEAD -> PROJECT-1522/newsroom-overview-phase5)
Author: Your Name
Date:   Wed Feb 25 20:57:12 2026 +0200
    PROJECT-1522: Implement newsroom overview phase five

commit ef08b0de5187be2afd5c9999ff0056e69346ae24 (origin/newsroom, newsroom)
Merge: 2e52982f5 d65c6d63f
Author: Your Name
Date:   Mon Feb 23 18:52:51 2026 +0200
    PROJECT-000: Merge events-calendar onto newsroom
```

That merge commit should not be in your feature branch history. The `merge-events-calendar-onto-newsroom` branch has not been officially merged yet — it just happened to be sitting on the `newsroom` branch at the time you branched off it.

Your one commit is perfectly fine. The base is the problem.

## Getting a Visual Overview

Before taking any action, it helps to get a clear picture of your branch topology:

```bash
git log --oneline --graph --all
```

This gives you a compact, visual representation of where all your branches point and how they relate to each other. It is the single most useful command for untangling branch confusion.

## Understanding Merge Parent References

Notice this line in the merge commit from `git log`:

```bash
Merge: 2e52982f5 d65c6d63f
```

These are the two parent commits of the merge. The **first parent** (`2e52982f5`) is where `newsroom` was _before_ the events-calendar was merged in — which is exactly where you wanted to branch from. The second parent (`d65c6d63f`) is the tip of the branch that was merged in.

Git always records both parents when creating a merge commit, and this is your way back to the correct base.

## Creating the Correct Branch

Now that you know the right starting point, you can create a new branch from that exact commit:

```bash
git checkout -b PROJECT-1522/newsroom-overview-phase5-v2 2e52982f5
```

The `git checkout -b <new-branch> <base>` form accepts any commit reference as the base — a branch name, a tag, or as in this case, a raw commit hash. Crucially, you can run this from _any_ branch you are currently on. Git will create the new branch pointing at `2e52982f5` and switch you to it in one step.

## Cherry-Picking Your Work

With the correct base in place, you can now replay just your commit onto it using `git cherry-pick`:

```bash
git cherry-pick 15281e5ab5022d8b1e293ce2805abb8b65ee44ad
```

Cherry-pick takes a commit and replays its changes as a new commit on top of wherever `HEAD` currently is. The commit message is carried over automatically, though the commit hash will differ because the parent is different.

Run `git log` again and you should see a clean history — your one commit sitting directly on top of `2e52982f5`, with no trace of the events-calendar merge.

## Handling Commit Hook Failures During Cherry-Pick

If you have conflicts during the cherry-pick, Git will pause and let you resolve them. Once resolved, you stage the files and then continue. However, if your project has commit hooks (pre-commit, commit-msg, and so on) that are blocking the `--continue` step, you might reach for:

```bash
git cherry-pick --continue --no-verify
```

That will not work. The `--no-verify` flag is not accepted by `--continue`. Instead, complete the commit manually:

```bash
git commit --no-verify
```

Git will pick up the cherry-pick state — including the commit message — and `--no-verify` will bypass the hooks. Just be mindful of _why_ the hook is failing, as hooks usually exist for a good reason.

## Cleaning Up

If you have already pushed the incorrectly based branch to your remote, delete it once you are confident the new branch is correct:

```bash
git push origin --delete PROJECT-1522/newsroom-overview-phase5
```

Then push your corrected branch:

```bash
git push -u origin PROJECT-1522/newsroom-overview-phase5-v2
```

## A Note on Resetting Shared Branches

You might wonder whether you could just `git reset HEAD~1` on the base branch to remove the unwanted merge commit. The short answer is: avoid it if the branch is already pushed to a remote that others might be working from. Resetting rewrites history, which means a force push, which means anyone else based off that branch is in trouble.

The cherry-pick approach leaves the base branch untouched and puts all the corrective work on your feature branch, which is much safer.

## Further Reading

- [`git cherry-pick` on MDN](https://git-scm.com/docs/git-cherry-pick) — official Git documentation
- [`git log` documentation](https://git-scm.com/docs/git-log) — all the flags for navigating history
- [`git checkout` documentation](https://git-scm.com/docs/git-checkout) — including branch creation from a specific base
