---
layout: ../../layouts/MarkdownPostLayout.astro
title: When Claude does not get your git
pubDate: 2024-07-08
description: "Perhaps it is the social bubble I find myself in, but it seems there is a lot of talk about gatekeeping happening at the moment. While the bubble metaphor does not quite work for what will follow, I do not have a better one, so humor me."
author: "Schalk Neethling"
tags: ["git"]
---

I ran into the following GitHub (Git?) error whilst pushing updates to a remote Git repository and thought I would ask one of the LLMs for some suggestions. I knew how to resolve this, but this is a pretty common use case for these tools and I thought I would see if there is a different or better way to achieve the same end result. The end result was... not great.

```bash
remote: Resolving deltas: 100% (48/48), done.
remote: error: Trace: c02cd148c75a88dda05d9612f6b351e5e3a684233af9a1d5de20ef463443bd8d
remote: error: See https://gh.io/lfs for more information.
remote: error: File src/assets/a11y-10/a11y-link-text.mp4 is 134.22 MB; this exceeds GitHub's file size limit of 100.00 MB
remote: error: GH001: Large files detected. You may want to try Git Large File Storage - https://git-lfs.github.com.
To https://github.com/schalkneethling/schalkneethling.com.git
 ! [remote rejected] main -> main (pre-receive hook declined)
```

---

Whilst pushing up the first version of my new website I ran into a problem with one of the video files I was adding to source control. The filesize exceeded 100 megabytes (MB) and as such GitHub rejected the push and recommended I look into using [Git Large File Storage](https://git-lfs.com/) (Git-LFS). I have used git-lfs before but when looking at the file in question I realized it did not need to be as large as it was.

After optimising the file using Handbrake, I created a new commit and pushed my branch to GitHub only to find that GitHub is rejecting the push for the same reason. Curious. So I thought I would remove the file from the repository, create a new commit, push, and see what happens.

Same end result. Even more curious.

## History you say?

Turns out that, even though I had removed the file from the repository, it was still being tracked in the history. I had one idea in mind of how I can resolve this but was curious whether there are other ways to achieve the same end result. So I asked one of the LLMs (Claude 3.5 Sonnet in this case) for some suggestions.

I pasted the error and awaited the response.

We are of to a great start as Claude confirmed that the error was indeed persisting because of the file being tracked in the history.

### What Claude suggested

The first command it suggested to solve the problem was the following:

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/assets/a11y-10/a11y-link-text.mp4" \
  --prune-empty --tag-name-filter cat -- --all
```

I am generally a bit weary of copying and pasting commands into my terminal without understanding what they do, and when it comes to Git even more so. The last thing I want is to blow up my entire repository or history. I [opened up the documentation for `git filter-branch`](https://git-scm.com/docs/git-filter-branch) and read through it. I am glad I did, because the page starts with a big 'ol warning.

> `git filter-branch` has a plethora of pitfalls that can produce non-obvious manglings of the intended history rewrite (and can leave you with little time to investigate such problems since it has such abysmal performance). These safety and performance issues cannot be backward compatibly fixed and as such, its use is not recommended.

I am not sure what a plethora is, but I am pretty sure I do not want to be in one. Not great Claude, not great. With my confidence in Claude shaken, I continued to read the following suggestions Claude had.

```bash
git update-ref -d refs/original/refs/heads/main
```

I'll be honest that I did not quite understand the [documentation for `git update-ref`](https://git-scm.com/docs/git-update-ref) however, the short description from the documentation did offer some peace of mind.

> git-update-ref - Update the object name stored in a ref safely

With the `-d` flag however, it does not so much update a `ref` as it deletes it.

> With -d flag, it deletes the named <ref> after verifying it still contains <old-oid>.

I am not sure about this. It seems a little scary to me. The final suggestions from Claude were the following:

```bash
git reflog expire --expire=now --all
git gc --prune=now
```

I am not sure what `git reflog expire` does, but I do know that `git gc` is the garbage collector for Git. Reading [the documentation for `git reflog` and `git reflog expire`](https://git-scm.com/docs/git-reflog) in particular made it clear that I probably want to stick with `gc`.

> The "expire" subcommand prunes older reflog entries. Entries older than expire time, or entries older than expire-unreachable time and not reachable from the current tip, are removed from the reflog. This is typically not used directly by end users — instead, see git-gc[1].

I was not convinced that `git gc` would solve the problem, but at least I know that it would not be destructive. I am glad I read the documentation however, because using `git gc --prune=now` is probably not what you want to do.

> `--prune=now` prunes loose objects regardless of their age and increases the risk of corruption if another process is writing to the repository concurrently;

Executing the following command will prune for the last two weeks by default unless it was changed in the configuration.

```bash
git gc --prune
```

As expected, this unfortunately did not resolve my problem. This is where I ended my journey with Claude for this particular topic. I did learn quite a few new things about Git so it wa not a complete loss.

## The solution

In the end I decided to go with what I had in mind orginally. I started by running `git log` to find the commit where the file was added to the repository. I then ran the following command to reset the `HEAD` to the commit before the one where the file was added. It can look something like the following:

```bash
commit 77633e62372e1069c92586c851ad1daa171f2cdc (25-code-convert-sass-variables-into-css-custom-properties)
Author: Schalk Neethling <schalk@mechanical.ink>
Date:   Thu Apr 25 23:37:22 2024 +0200

    chore: set up customer properties

    This converts the relevant Sass variables to CSS custom properties and introduces additional and missing custom properties.

    fix #25
```

Using the `commit` SHA from the `git log` output, I ran the following command:

```bash
git reset HEAD --hard 77633e62372e1069c92586c851ad1daa171f2cdc
```

This command will reset the `HEAD` to the commit before the one where the file was added. Now that he file is no longer tracked by Git I could safely remove it from the repository, add my changes, create a new commit, and push the branch to GitHub.

```bash
git add .
git commit -m "chore: optimise a11y-link-text.mp4"
git push origin branch-name
```

This time the push was successful and I could create a pull request to merge the changes into the `main` branch. I guess it is another of those [Occam's Razor](https://en.wikipedia.org/wiki/Occam's_razor) situations. I hope you found this helpful and that it saves you some time and frustration.

I am not saying that one should not use these tools, that is not the crux of this post. What I _am_ saying as that one should be cautious when using them and understand what they do. It is a rule I generally followed even before the availability of these powerful systems and it is still serving me well.

### A side note on `git gc`

I was wondering whether I should run `git gc` more frequently to keep my repository in good shape and optimized and continued to read a bit more. In essense, while it does not hurt to run it every now and then, it is not something you need to be too concerned with. The reason is that Git runs `gc` automatically as part of some of the porcelain commands which creates new object such as `git commit`.

Now what is a procelain command? I had the same question. It turns out that porcelain commands are the high-level commands that are user-friendly and are meant to be used by end users. Examples of porcelain commands are `git add`, `git commit`, `git push`, and `git pull`. The opposite of porcelain commands are the plumbing commands which are low-level commands such as `git cat-file`, `git hash-object`, and `git rev-parse`.

We can and should try to learn something new every day. Until the next one, happy coding!
