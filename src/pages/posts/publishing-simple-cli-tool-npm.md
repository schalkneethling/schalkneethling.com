---
layout: ../../layouts/MarkdownPostLayout.astro
title: Publishing a simple CLI tool on NPM
pubDate: 2023-01-01
description: A step by step guide to publishing a simple CLI tool to the NPM registry.
author: "Schalk Neethling"
tags: ["nodejs", "npm"]
---

Developers, like other artisans, are dependent on great tools. From complex tools such as code editors to tools that automate away the mundane, libraries, and simple command-line utilities. For a lot of these, in the JavaScript world, we look to package registries such as NPM. In this post we will look at a recent utility I published to NPM and go over the steps you need to take to publish _your_ own.

## calavera@hugo-skeleton

Before we dive into the steps of creating a utility and publishing it, let us take a quick detour and look at the utility I published.

I often build sites using [Hugo](https://gohugo.io/), a static site generator written in [Go](https://golang.org/). While Hugo has a [bountifull collection](https://themes.gohugo.io/) of themes, I rarely use a theme, but instead build bespoke sites meant for a defined brand or product.

This does mean that there is some scaffolding needed when creating a new Hugo site. While running `hugo new site ./sitename` does generate some basics, it is _really_ just the basics. In fact, other than `config.toml` and the default Markdown file in `archetypes`, it is pretty much a set of empty base folders.

Now, you could keep a folder of your “bootstrap” files on your local machine and copy and paste everything from source to destination but, where is the fun in that? 😀 Also, this is centralised to your current computer, cannot be easily accessed from a different context, cannot be used by others, nor con it be contributed to by the wider Hugo community.

We are then missing two pieces.

1. Add the scaffolding to source control and publish it to a service such as [GitHub](https://github.com/)
2. Make it easilly “installable” from anywhere.

The second piece is what I will the cover here.

## The files

While I won't go into the details of what make up Hugo Skeleton, you can [see the source on GitHub](https://github.com/project-calavera/hugo-skeleton). In essence though, it is made up of the following:

- `archetypes` - Nothing new here
- `assets/sass` - Some basic [SASS](https://sass-lang.com/) code I find useful for pretty much all projects.
- `content` - Includes the base [frontmatter](https://gohugo.io/content-management/front-matter#readout) for the index page
- `layouts` - Some useful base layouts and partials to get you started
- `static/media` - Base static assets such as favicons and iconography
- `.eslintrc.json` - A base [ESLint](https://eslint.org/) config
- `.prettierrc` - Default [Prettier](https://prettier.io/) config file
- `config.toml` - An expanded version of the default you get with `hugo new site`

The final piece it contains is the utility that will allow us to easily add the above scaffolding to any new Hugo site.

## The utility

The utility is a simple JavaScript file that walks the directory structure, filters out an ignored list of files and writes the resulting files an folders to the output folder the user specified.

To make this file executable by Node we add the following [shebang line](<https://en.wikipedia.org/wiki/Shebang_(Unix)>) as the very first line in our JavaScript file:

```bash
#!/usr/bin/env node
```

Intead of going into the details here, the gist is:

> the very first line in an executable plain-text file on Unix-like platforms that tells the system what interpreter to pass that file to for execution, via the command line following the magic #! prefix (called shebang).

For more details, please read this [great answer on Stackoverflow](https://stackoverflow.com/questions/33509816/what-exactly-does-usr-bin-env-node-do-at-the-beginning-of-node-files#answer-33510581).

## Getting ready to publish

Now that we have our utility ready we need to prepare our entire package for publishing. Publishing here refers to publishing to the [npm registry](https://npmjs.org/) which is from where we will also install and run our utility.

In the project's `package.json` I have the following two entries:

```json
"bin": "./src/index.js",
```

[`bin`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#bin) is where we tell npm that we have an executable that we would like added to the `PATH` when using npm.

> NOTE: Seeing that I have a single executable this works just fine. Sometimes however, you might bundle a couple of executables as a single package. In those instances you would opt for the object style notation as shown in the docs linked above.

While we want to publish most of the content of our repository there are some things we want to exclude. To do this we have a couple of options. Firstly, if you already have a `.gitignore` that ignores all the assets you want to keep out of your published package, there is nothing more to do.

However, what you want to keep out of your published package does not always match what you want to keep, or keep out of, your code repository. In those instances, we can add an additional `.npmignore` file.

I my case I had only one file that was not currently added to my `.gitignore` and it just so happens I also do not want it to be added to the repo. For demonstration purposes though, let's say I wanted it in my repository but exclude it from the npm package. In that case you would add a new file and name it `.npmignore` and specify the file(s) ti ignore. For example:

```
.dccache
```

There are a lot of things npm will automatically exclude by default and also some files it will always inlcude. You can [read the details in their docs](https://docs.npmjs.com/cli/v7/using-npm/developers#keeping-files-out-of-your-package).

## Publish it!

Before we actually publish, it is good to make sure that it will actually [install and work as intended](https://docs.npmjs.com/cli/v7/using-npm/developers#before-publishing-make-sure-your-package-installs-and-works). The docs provide a variety of options but for my purpose here, I tested it a little differently. Instead of using `link` I used [`npx`](https://docs.npmjs.com/cli/v7/commands/npx) directly. Here is what I did.

I first created a new Hugo site inside a `tmp` directory using `hugo site new ./tmp` and changed directory into this new directory. From here I ran:

```bash
npx ../calavera/hugo-skeleton --output=.
```

> [npx](https://docs.npmjs.com/cli/v7/commands/npx) - tl;dr “Run a command from a local or remote npm package”

After running into and fixing a couple of bugs(that is what testing is for 😀), I am now ready to publish this.

If you do not already have an account on [npmjs.org](https://npmjs.org/) you will need to create one and then add and authenticate this user locally using the [npm `adduser` command](https://docs.npmjs.com/cli/v7/commands/npm-adduser). You can confirm that you are logged in by running `npm whoami` which will output something like:

```bash
❯ npm whoami
schalkneethling
```

We are ready to publish!

> NOTE: The `name` for this project is set to `@calavera/hugo-skeleton` which may be new to some. The reason for this is because I am [publishing this as a scoped package](https://docs.npmjs.com/cli/v7/using-npm/scope).

> Also, if you were following along with your CLI, make sure that everything has been commited and pushed to source control and that you are on the `main` branch of your repository.

After all of the above, publishing is a little anticlimactic 🙃

Run the [publish command](https://docs.npmjs.com/cli/v7/using-npm/developers#publish-your-package)

> If you want to get an idea of what will be published and other related details, you can first run `npm publish --dry-run`

```bash
npm publish --access public
```

The `--acess public` piece is required for scoped packages on initial publish to tell the registry that this is meant to be public and not private. If you do not specify this, you might see an error like the following:

```
402 Payment Required - PUT https://registry.npmjs.org/@project-calavera%2fhugo-skeleton - You must sign up for private packages
```

If all goes well your output should end with a confirmation like this:

```
+ @project-calavera/hugo-skeleton@0.0.1
```

You will also recieve a confirmation email at the email you address you signed up with on npmjs.com. If I now navigate to [https://www.npmjs.com/package/@project-calavera/hugo-skeleton](https://www.npmjs.com/package/@project-calavera/hugo-skeleton) I can see that the package has indeed been published.

Only one thing left to do. Test the published package on a new Hugo site.

```bash
hugo new site tmp
cd tmp
npx @project-calavera/hugo-skeleton@latest output=.
```

🎉 ~ It works ~ 🎉

I hope you found this writeup useful and would love to hear about the tools and utilities you make.
