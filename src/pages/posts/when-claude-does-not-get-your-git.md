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
