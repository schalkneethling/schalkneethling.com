---
layout: ../../layouts/MarkdownPostLayout.astro
title: Merging a repository into an existing repository without losing commit history
pubDate: 2023-02-01
description: How do I merge one repository into another without losing commit history? This is a quick guide on how to do this.
author: "Schalk Neethling"
tags: ["git"]
---

On the MDN Web Docs project we are in the process of merging smaller example code repositories into larger parent repositories on the MDN Web Docs project. While we thought that copying the files from one repository into the new one would lose commit history, we felt that this might be an OK strategy. After all, we are not deleting the old repository but archiving it.

After having moved a few of these, we did [receive an issue from a community member](https://github.com/mdn/dom-examples/issues/134) stating that it is not ideal to lose history while moving these repositories and that there [could be a relatively simple way](https://github.com/mdn/dom-examples/issues/134) to avoid this. I experimented with a couple of different options and finally settled on a strategy based on the one [shared by Eric Lee on his blog](https://saintgimp.org/2013/01/22/merging-two-git-repositories-into-one-repository-without-losing-file-history/).

> **tl;dr** The approach is to use basic git commands to apply all of the commit histories of our old repo onto a new repo without needing special tooling.

- [Getting started](#getting-started)
- [How to exclude subdirectories when using `mv`](#how-to-exclude-subdirectories-when-using-mv)
- [Handling hidden files and creating a pull request](#handling-hidden-files-and-creating-a-pull-request)
- [Merging our repositories](#merging-our-repositories)
  - [In Conclusion](#in-conclusion)

## Getting started

For the experiment, I used the `[sw-test](https://github.com/mdn/sw-test)` repository that is meant to be merged into the `[dom-examples](https://github.com/mdn/dom-examples)` repository.

This is how Eric describes the first steps:

```bash
# Assume the current directory is where we want the new repository to be created
# Create the new repository

git init

# Before we do a merge, we need to have an initial commit, so we’ll make a dummy commit

dir > deleteme.txt
git add .
git commit -m “Initial dummy commit”

# Add a remote for and fetch the old repo
git remote add -f old_a <OldA repo URL>

# Merge the files from old_a/master into new/master
git merge old_a/master
```

I could skip everything up to the `git remote ...` step as my target repository already had some history, so I started as follows:

```bash
git clone https://github.com/mdn/dom-examples.git
cd dom-examples
```

Running `git log` on this repository, I see the following commit history:

```bash
commit cdfd2aeb93cb4bd8456345881997fcec1057efbb (HEAD -> master, upstream/master)
Merge: 1c7ff6e dfe991b
Author:
Date:   Fri Aug 5 10:21:27 2022 +0200

    Merge pull request #143 from mdn/sideshowbarker/webgl-sample6-UNPACK_FLIP_Y_WEBGL

    “Using textures in WebGL”: Fix orientation of Firefox logo

commit dfe991b5d1b34a492ccd524131982e140cf1e555
Author:
Date:   Fri Aug 5 17:08:50 2022 +0900

    “Using textures in WebGL”: Fix orientation of Firefox logo

    Fixes <https://github.com/mdn/content/issues/10132>

commit 1c7ff6eec8bb0fff5630a66a32d1b9b6b9d5a6e5
Merge: be41273 5618100
Author:
Date:   Fri Aug 5 09:01:56 2022 +0200

    Merge pull request #142 from mdn/sideshowbarker/webgl-demo-add-playsInline-drop-autoplay

    WebGL sample8: Drop “autoplay”; add “playsInline”

commit 56181007b7a33907097d767dfe837bb5573dcd38
Author:
Date:   Fri Aug 5 13:41:45 2022 +0900

```

With the current setup, I could continue from the `git remote` command, but I wondered if the current directory contained files or folders that would conflict with those in the service worker repository. I searched around some more to see if anyone else had run into this same situation but did not find an answer. Then it hit me! I need to prepare the service worker repo to be moved.

What do I mean by that? I need to create a new directory in the root of the `sw-test` repo called `service-worker/sw-test` and move all relevant files into this new subdirectory. This will allow me to safely merge it into `dom-examples` as everything is contained in a subfolder already.

To get started, I need to clone the repo we want to merge into `dom-examples`.

```bash
git clone https://github.com/mdn/sw-test.git
cd sw-test
```

Ok, now we can start preparing the repo. The first step is to create our new subdirectory.

```bash
mkdir service-worker
mkdir service-worker/sw-test
```

With this in place, I simply need to move everything in the root directory to the subdirectory. To do this, we will make use of the [move (`mv`) command](https://www.rapidtables.com/code/linux/mv.html):

> NOTE: Do not yet run any of the commands below at this stage.

```bash

# enable extendedglob for ZSH
set -o extendedglob
mv ^sw-test(D) service-worker/swtest
```

The above command is a little more complex than you might think. It uses a negation syntax. The next section explains why we need it and how to enable it.

## How to exclude subdirectories when using `mv`

While the end goal seemed simple, I am pretty sure I grew a small animal's worth of grey hair trying to figure out how to make that last move command work. I read many StackOverflow threads, blog posts, and manual pages for the different commands with varying amounts of success. However, none of the initial set of options quite met my needs. I finally stumbled upon two StackOverflow threads that brought me to the answer.

- [How to move all files in a folder to a sub folder in zsh w/ Mac OS X?](https://unix.stackexchange.com/questions/567970/how-to-move-all-files-in-a-folder-to-a-sub-folder-in-zsh-w-mac-os-x/)
- [How to move all files in current folder to subfolder?](https://askubuntu.com/questions/91740/how-to-move-all-files-in-current-folder-to-subfolder)

To spare you the trouble, here is what I had to do.

> First, a note. I am on a Mac using ZSH (since macOS Catalina, this is now the default shell). Depending on your shell, the instructions below may differ.

For new versions of ZSH, you use the `set -o` and `set +o` commands to enable and disable settings. To enable `extendedglob`, I used the following command:

```bash

# Yes, this _enables_ it
set -o extendedglob
```

On older versions of ZSH, you use the `setopt` and `unsetopt` commands.

```bash
setopt extendedglob
```

With `[bash](https://www.gnu.org/software/bash/)`, you can achieve the same using the following command:

```bash
shopt -s extglob
```

Why do you even have to do this, you may ask? Without this, you will not be able to use the negation operator I use in the above move command, which is the crux of the whole thing. If you do the following, for example:

```bash
mkdir service-worker
mv * service-worker/sw-test
```

It will "work," but you will see an error message like this:

```bash
mv: rename service-worker to service-worker/sw-test/service-worker: Invalid argument
```

We _want_ to tell the operating system to move everything into our new subfolder except the subfolder itself. We, therefore, need this negation syntax. It is not enabled by default because it could cause problems if file names contain some of the `extendedglob` patterns, such as `^`. So we need to enable it explicitly.

> NOTE: You might also want to disable it after completing your move operation.

Now that we know how and why we want `extendedglob` enabled, we move on to using our new powers.

> NOTE: Do not yet run any of the commands below at this stage.

```bash
mv ^sw-test(D) service-worker/sw-test
```

The above means:

- Move all the files in the current directory into `service-worker/sw-test`.
- Do not try to move the `service-worker` directory itself.
- The (D) option tells the move command to also move all hidden files, such as `.gitignore`, and hidden folders, such as `.git`.

> NOTE: I found that if I typed `mv ^sw-test` and pressed tab, my terminal would expand the command to `mv CODE_OF_CONDUCT.md LICENSE README.md app.js gallery image-list.js index.html service-worker star-wars-logo.jpg style.css sw.js.` If I typed `mv ^sw-test(D)` and pressed tab, it would expand to `mv .git .prettierrc CODE_OF_CONDUCT.md LICENSE README.md app.js gallery image-list.js index.html service-worker star-wars-logo.jpg style.css sw.js`. This is interesting because it clearly demonstrates what happens under the hood. This allows you to see the effect of using `(D)` clearly. I am not sure whether this is just a native ZSH thing or one of my terminal plugins, such as [Fig](https://fig.io). Your mileage may vary.

## Handling hidden files and creating a pull request

While it is nice to be able to move all of the hidden files and folders like this, it causes a problem. Because the `.git` folder is transferred into our new subfolder, our root directory is no longer seen as a Git repository. This is a problem.

Therefore, I will not run the above command with `(D)` but instead move the hidden files as a separate step. I will run the following command instead:

```bash
mv ^(sw-test|service-worker) service-worker/sw-test
```

At this stage, if you run `ls` it will look like it moved everything. That is not the case because the `ls` command does not list hidden files. To do that, you need to pass the `-A` flag as shown below:

```bash
ls -A
```

You should now see something like the following:

```bash
❯ ls -A
.git           .prettierrc    service-worker
```

Looking at the above output, I realized that I should not need to move the `.git` folder. All I needed to do now was to run the following command:

```bash
mv .prettierrc service-worker
```

After running the above command, `ls -A` will now output the following:

```bash
❯ ls -A
.git simple-service-worker
```

Time to do a little celebration dance 😁

We can move on now that we have successfully moved everything into our new subdirectory. However, while doing this, I realized I forgot to create a [feature branch](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow) for the work.

Not a problem. I just run the command, `git switch -C prepare-repo-for-move`. Running `git status` at this point should output something like this:

```bash
❯ git status
On branch prepare-repo-for-move
Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	deleted:    .prettierrc
	deleted:    CODE_OF_CONDUCT.md
	deleted:    LICENSE
	deleted:    README.md
	deleted:    app.js
	deleted:    gallery/bountyHunters.jpg
	deleted:    gallery/myLittleVader.jpg
	deleted:    gallery/snowTroopers.jpg
	deleted:    image-list.js
	deleted:    index.html
	deleted:    star-wars-logo.jpg
	deleted:    style.css
	deleted:    sw.js

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	service-worker/

no changes added to commit (use "git add" and/or "git commit -a")
```

Great! Let’s add our changes and commit them.

```bash
git add .
git commit -m 'Moved all source files into new subdirectory'
```

Now we want to push our changes and open a pull request.

Woop! Let’s push:

```bash
git push origin prepare-repo-for-move
```

Head over to your repository on GitHub. You should see a banner like "mv-files-into-subdir had recent pushes less than a minute ago" and a "Compare & pull request" button.

Click the button and follow the steps to open the [pull request.](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) Once the pull request is green and ready to merge, go ahead and merge!

> NOTE: Depending on your workflow, this is the point to ask a team member to review your proposed changes before merging. It is also a good idea to have a look over the changes in the “Files changed” tab to ensure nothing is part of the pull request you did not intend. If any [conflicts prevent](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts) your pull request from being merged, GitHub will warn you about these, and you will need to resolve them. This can be done directly on [GitHub.com](http://GitHub.com) or locally and pushed to GitHub as a separate commit.

When you head back to the code view on GitHub, you should see our new subdirectory and the `.gitignore` file.

With that, our repository is ready to move.

## Merging our repositories

Back in the terminal, you want to switch back to the `main` branch:

```bash
git switch main
```

You can now safely delete the feature branch and pull down the changes from your remote.

```bash
git branch -D prepare-repo-for-move
git pull origin main
```

Running `ls -A` after pulling the latest should now show the following:

```bash
❯ ls -A
.git           README.md      service-worker
```

Also, running `git log` in the root outputs the following:

```bash
commit 8fdfe7379130b8d6ea13ea8bf14a0bb45ad725d0 (HEAD -> gh-pages, origin/gh-pages, origin/HEAD)
Author: Schalk Neethling
Date:   Thu Aug 11 22:56:48 2022 +0200

    Create README.md

commit 254a95749c4cc3d7d2c7ec8a5902bea225870176
Merge: f5c319b bc2cdd9
Author: Schalk Neethling
Date:   Thu Aug 11 22:55:26 2022 +0200

    Merge pull request #45 from mdn/prepare-repo-for-move

    chore: prepare repo for move to dom-examples

commit bc2cdd939f568380ce03d56f50f16f2dc98d750c (origin/prepare-repo-for-move)
Author: Schalk Neethling
Date:   Thu Aug 11 22:53:13 2022 +0200

    chore: prepare repo for move to dom-examples

    Prepping the repository for the move to dom-examples

commit f5c319be3b8d4f14a1505173910877ca3bb429e5
Merge: d587747 2ed0eff
Author: Ruth John
Date:   Fri Mar 18 12:24:09 2022 +0000

    Merge pull request #43 from SimonSiefke/add-navigation-preload
```

Here are the commands left over from where we diverted earlier on.

```bash
# Add a remote for and fetch the old repo
git remote add -f old_a <OldA repo URL>

# Merge the files from old_a/master into new/master
git merge old_a/master
```

Alrighty, let’s wrap this up. First, we need to move into the root of the project to which we want to move our project. For our purpose here, this is the `dom-examples` directory. Once in the root of the directory, run the following:

```bash
git remote add -f swtest https://github.com/mdn/sw-test.git
```

> NOTE: The `-f` tells Git to fetch the remote branches. The `ssw` is a name you give to the remote so this could really be anything.

After running the command, I got the following output:

```bash
❯ git remote add -f swtest https://github.com/mdn/sw-test.git
Updating swtest
remote: Enumerating objects: 500, done.
remote: Counting objects: 100% (75/75), done.
remote: Compressing objects: 100% (57/57), done.
remote: Total 500 (delta 35), reused 45 (delta 15), pack-reused 425
Receiving objects: 100% (500/500), 759.76 KiB | 981.00 KiB/s, done.
Resolving deltas: 100% (269/269), done.
From <https://github.com/mdn/sw-test>
 * [new branch]      gh-pages        -> swtest/gh-pages
 * [new branch]      master          -> swtest/master
 * [new branch]      move-prettierrc -> swtest/move-prettierrc
 * [new branch]      rename-sw-test  -> swtest/rename-sw-test
```

> NOTE: While we deleted the branch locally, this is not automatically synced with the remote, so this is why you will still see a reference to the `rename-sw-test` branch. If you wanted to delete it on the remote, you would run the following from the root of that repository: `git push origin :rename-sw-test` (if you have configured your repository “to [automatically delete head branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches)”, this will be automatically deleted for you)

Only a few commands left.

> NOTE: Do not yet run any of the commands below at this stage.

```bash
git merge swtest/gh-pages
```

Whoops! When I ran the above, I got the following error:

```bash
❯ git merge swtest/gh-pages
fatal: refusing to merge unrelated histories
```

But this is pretty much exactly what I _do_ want, right? This is the default behavior of the `merge` command, but you can pass a flag and allow this behavior.

```bash
git merge swtest/gh-pages --allow-unrelated-histories
```

> NOTE: Why `gh-pages`? More often than not, the one you will merge here will be `main` but for this particular repository, the default branch was named `gh-pages`. It used to be that when using GitHub pages, you would need a branch called `gh-pages` that will then be automatically deployed by GitHub to a URL that would be something like mdn.github.io/sw-test.

After running the above, I got the following:

```bash
❯ git merge swtest/gh-pages --allow-unrelated-histories
Auto-merging README.md
CONFLICT (add/add): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

Ah yes, of course. Our current project and the one we are merging both contain a `README.md`, so Git is asking us to decide what to do. If you open up the `README.md` file in your editor, you will notice something like this:

```markdown
<<<<<<< HEAD

=======
```

There might be a number of these in the file. You will also see some entries like this, `>>>>>>> swtest/gh-pages`. This highlights the conflicts that Git is not sure how to resolve. You could go through and clear these manually. In this instance, I just want what is in the `README.md` at the root of the `dom-examples` repo, so I will clean up the conflicts or copy the content from the `README.md` from GitHub.

As Git requested, we will add and commit our changes.

```bash
git add .
git commit -m 'merging sw-test into dom-examples'
```

The above resulted in the following output:

```bash
❯ git commit
[146-chore-move-sw-test-into-dom-examples 4300221] Merge remote-tracking branch 'swtest/gh-pages' into 146-chore-move-sw-test-into-dom-examples
```

If I now run `git log` in the root of the directory, I see the following:

```bash
commit 4300221fe76d324966826b528f4a901c5f17ae20 (HEAD -> 146-chore-move-sw-test-into-dom-examples)
Merge: cdfd2ae 70c0e1e
Author: Schalk Neethling
Date:   Sat Aug 13 14:02:48 2022 +0200

    Merge remote-tracking branch 'swtest/gh-pages' into 146-chore-move-sw-test-into-dom-examples

commit 70c0e1e53ddb7d7a26e746c4a3412ccef5a683d3 (swtest/gh-pages)
Merge: 4b7cfb2 d4a042d
Author: Schalk Neethling
Date:   Sat Aug 13 13:30:58 2022 +0200

    Merge pull request #47 from mdn/move-prettierrc

    chore: move prettierrc

commit d4a042df51ab65e60498e949ffb2092ac9bccffc (swtest/move-prettierrc)
Author: Schalk Neethling
Date:   Sat Aug 13 13:29:56 2022 +0200

    chore: move prettierrc

    Move `.prettierrc` into the siple-service-worker folder

commit 4b7cfb239a148095b770602d8f6d00c9f8b8cc15
Merge: 8fdfe73 c86d1a1
Author: Schalk Neethling
Date:   Sat Aug 13 13:22:31 2022 +0200

    Merge pull request #46 from mdn/rename-sw-test
```

Yahoooo! That is the history from `sw-test` now in our current repository! Running `ls -A` now shows me:

```bash
❯ ls -A
.git                           indexeddb-examples             screen-wake-lock-api
.gitignore                     insert-adjacent                screenleft-screentop
CODE_OF_CONDUCT.md             matchmedia                     scrolltooptions
LICENSE                        media                          server-sent-events
README.md                      media-session                  service-worker
abort-api                      mediaquerylist                 streams
auxclick                       payment-request                touchevents
canvas                         performance-apis               web-animations-api
channel-messaging-basic        picture-in-picture             web-crypto
channel-messaging-multimessage pointer-lock                   web-share
drag-and-drop                  pointerevents                  web-speech-api
fullscreen-api                 reporting-api                  web-storage
htmldialogelement-basic        resize-event                   web-workers
indexeddb-api                  resize-observer                webgl-examples
```

And if I run `ls -A service-worker/`, I get:

```bash
❯ ls -A service-worker/
simple-service-worker
```

And finally, running `ls -A service-worker/simple-service-worker/` shows:

```bash
❯ ls -A service-worker/simple-service-worker/
.prettierrc        README.md          image-list.js      style.css
CODE_OF_CONDUCT.md app.js             index.html         sw.js
LICENSE            gallery            star-wars-logo.jpg
```

All that is left is to push to remote.

```bash
git push origin 146-chore-mo…dom-examples
```

> **NOTE:** Do not squash merge this pull request, or else all commits will be squashed together as a single commit. Instead, you want to use a merge commit. You can read all the [details about merge methods](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github) in their documentation on GitHub.

After you merge the pull request, go ahead and browse the commit history of the repo. You will find that the commit history is intact and merged. o/\o You can now go ahead and either delete or archive the old repository.

At this point having the remote configured for our target repo serve no purpose so, we can safe remove the remote.

```bash
git remote rm swtest
```

### In Conclusion

The steps to accomplish this task is then as follows:

```bash
# Clone the repository you want to merge
git clone https://github.com/mdn/sw-test.git
cd sw-test

# Create your feature branch
git switch -C prepare-repo-for-move
# NOTE: With older versions of Git you can run:
# git checkout -b prepare-repo-for-move

# Create directories as needed. You may only need one, not two as
# in the example below.
mkdir service-worker
mkdir service-worker/sw-test

# Enable extendedglob so we can use negation
# The command below is for modern versions of ZSH. See earlier
# in the post for examples for bash and older versions of ZSH
set -o extendedglob

# Move everything except hidden files into your subdirectory,
# also, exclude your target directories
mv ^(sw-test|service-worker) service-worker/sw-test

# Move any of the hidden files or folders you _do_ want
# to move into the subdirectory
mv .prettierrc service-worker

# Add and commit your changes
git add .
git commit -m 'Moved all source files into new subdirectory'

# Push your changes to GitHub
git push origin prepare-repo-for-move

# Head over to the repository on GitHub, open and merge your pull request
# Back in the terminal, switch to your `main` branch
git switch main

# Delete your feature branch
# This is not technically required, but I like to clean up after myself :)
git branch -D prepare-repo-for-move
# Pull the changes you just merged
git pull origin main

# Change to the root directory of your target repository
# If you have not yet cloned your target repository, change
# out of your current directory
cd ..

# Clone your target repository
git clone https://github.com/mdn/dom-examples.git
# Change directory
cd dom-examples

# Create a feature branch for the work
git switch -C 146-chore-move-sw-test-into-dom-examples

# Add your merge target as a remote
git remote add -f ssw https://github.com/mdn/sw-test.git

# Merge the merge target and allow unrelated history
git merge swtest/gh-pages --allow-unrelated-histories

# Add and commit your changes
git add .
git commit -m 'merging sw-test into dom-examples'

# Push your changes to GitHub
git push origin 146-chore-move-sw-test-into-dom-examples

# Open the pull request, have it reviewed by a team member, and merge.
# Do not squash merge this pull request, or else all commits will be
# squashed together as a single commit. Instead, you want to use a merge commit.

# Remove the remote for the merge target
git remote rm swtest
```

Hopefully, you now know how to exclude subdirectories using the mv command, set and view shell configuration, and merge the file contents of a git repo into a new repository while preserving the entire commit history using only basic git commands.
