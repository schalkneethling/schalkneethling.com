---
title: Matrix Strategy - Improving a project’s CI pipeline
pubDate: 2022-04-01
description: Let’s work through the process of improving a basic GitHub Action CI workflow to cover multiple Node.js versions and operating systems.
author: "Schalk Neethling"
tags: ["github"]
---

Recently, I have become more and more responsible for maintaining, improving and creating GitHub workflows using GitHub Actions. On some of my side projects such as [Project Calavera](https://github.com/project-calavera/project-calavera), I realised that my pipeline really did not do all the testing I needed. Test coverage is pretty decent but, I was only running this again one version of Node.js, and only on Ubuntu.

This being a tool that can be used by people on multiple operating systems and Node.js versions, I wanted to make sure that my pipeline covered as many cases as possible. I set about [learning more about GitHub Actions](https://lab.github.com/githubtraining/devops-with-github-actions) and workflows and applied my learning to the project. In this post I will then share with _you_ what I learned and how I improved the Project Calavera pipeline.

## The current pipeline

Before we make changes, let me show you the existing pipeline:

```yml
name: test-calavera
on: [pull_request]

jobs:
  test:
    name: test-calavera
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "12"
      - name: Install dependencies
        run: |
          yarn install
      - name: Run tests
        run: |
          yarn test
```

As you can see from the above, this will only run on the latest version of Ubuntu using Node.js version 12. Let’s improve this pipeline.

## More Node.js versions

The first step is running the tests against more version of Node.js. I looked at the [release status page](https://nodejs.org/en/about/releases/) on the Node.js website and, at the time of writing, it showed version 12 being in long term support(LTS) maintenance with an imminent end of life in a month. Version 14 was also in LTS maintenance with and end of life date of April 30, 2023. Version 16 is in Active LTS entering maintenance LTS on October 18, 2022. Node.js 17 just entered LTS maintenance with version 18 being the current release.

For Project Calavera it then makes the most sense to run against version 14, 16, and 18. Ok, but how do we set-up our workflow to do this? For this we will use a [matrix strategy](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs). From the docs:

> A matrix strategy lets you use variables in a single job definition to automatically create multiple job runs that are based the combinations of the variables. For example, you can use a matrix strategy to test your code in multiple versions of a language or on multiple operating systems.

```yml
name: test-calavera
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]

    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Run tests
        run: yarn test
```

You can also use expressions in the workflow to dynamically set values or output values. Above we use it to give the `setup-node` a dynamic name based on the value of `matrix.node-version`. We then also use it to set the Node.js versions `setup-node` should, well, set up. While we are here, we also enable [caching of global package data](https://github.com/actions/setup-node#caching-global-packages-data).

I also simplified the syntax above a bit. As our install and test steps simply execute a single command there was no need to use the previous syntax. When running the install step with [`npm`](https://docs.npmjs.com/) it is common to use `npm ci` instead of `npm install`. The closest relative to this in [Yarn](https://classic.yarnpkg.com/) is [`yarn install --frozen-lockfile`](https://classic.yarnpkg.com/en/docs/cli/install#toc-yarn-install-frozen-lockfile) so, I also updates that line as it could improve build times. This becomes more and more important the more targets you run your builds and tests against.

## Multiple operating systems

As mentioned earlier, this tool could be used on multiple operating systems and currently, it is only tested on Linux. To run our tests on other operating systems, we need to expand our matrix.

> NOTE: I use ellipses ... to only show the parts of the workflow we're interested in, but you should not copy the ellipses directly.

```yml
strategy:
    matrix:
    os: [ubuntu-latest, windows-latest]
    node-version: [14.x, 16.x, 18.x]
    ...
```

Here we tell the runner to now run our tests on the latest version of Ubuntu as well as Windows. Something to keep in mind here is that for each Node.js version, the workflow will run tests against both Ubuntu _and_ Windows. It means that we have now instantly gone from running three test runs to six. Therefore, it is good to be mindful here as this will require more and more computing power that could [negatively impact our environment](https://greensoftware.foundation/). the old mantra applies, "just because you can, does not mean you should". 🌲 🌲 🌲

Our workflow now looks as follows:

```yml
name: test-calavera
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [14.x, 16.x, 18.x]

    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Run tests
        run: yarn test
```

As a final small refactor, let’s collapse those last four lines to end up with the following workflow:

```yml
name: test-calavera

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [14.x, 16.x, 18.x]

    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: "yarn"
      - name: Install and test
        run: |
          yarn install --frozen-lockfile
          yarn test
```

I hope you found this useful and that it has helps you improve your GitHub workflows.
