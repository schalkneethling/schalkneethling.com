---
layout: ../../layouts/MarkdownPostLayout.astro
title: How Playwright Can Help You Write Better Tests by Separating Test and Production Data
pubDate: 2022-07-01
description: When running your Playwright tests, how do you load a different set of data based on the current execution environment?
author: "Schalk Neethling"
tags: ["testing", "javascript"]
---

One of the open source projects I am tinkering on is called the [Developer Toolchest](https://developer-toolchest.com). You can think of it in two ways:

- A bookmarking tool where you store all of the online utilities, documentation, and anything developer related you use but tend to forget the name or URL. Developer Toolchest allows you to tag each tool you add and later search using those tags. For example, while you cannot remember the name or URL, you know it was a design tool. Searching for the design tag will list all tools tagged as design.
- The other way to use the Developer Toolchest is to find interesting tools for your needs. Maybe you are looking for a Read-event-print loop (repl), a tool for image compression, or a javascript framework. Developer Toolchest is the perfect tool for this.

## The problem

The database of tools (currently managed via a JSON file, but I am considering moving it to MongoDB or similar) is a community-driven initiative where everyone is welcome to contribute their tools of choice. Search is the cornerstone of this tool an I noticed that the search functionality can be greatly improved.

I use an open-source module called [flexsearch](https://github.com/nextapps-de/flexsearch) to manage the index and search the index. The tool is incredibly well-written and is not the reason search is not great. The reason is that I do not yet know how to wield its powers. Therefore, I decided to change that through an [exploratory project using Jest](https://github.com/schalkneethling/learning-flexsearch).

I identified some areas where I am not using the tool correctly and are currently working on integrating my learnings to improve the search's effectiveness. This is where Playwright comes into play.

## Why Playwright?

While implementing the changes, I want to ensure not to regress now or in the future. I also wanted to [use Playwright in a test-driven](<https://www.agilealliance.org/glossary/tdd/#q=~(infinite~false~filters~(postType~(~'page~'post~'aa_book~'aa_event_session~'aa_experience_report~'aa_glossary~'aa_research_paper~'aa_video)~tags~(~'tdd))~searchTerm~'~sort~false~sortDirection~'asc~page~1)>) manner but immediately faced the challenge of separating the production data from the test data.

I did not want to test against the production JSON data, as it makes for flaky tests mainly because I will be testing against a moving target, so to speak. I want to control the data I am testing against to make the results predictable. If the tests suddenly start failing and the tests are running against production data, it can simply be because the production data has changed. Say, for example, there is a test that opens the webpage, searches for a specific string, and expects three results. Tomorrow a contributor adds another tool that uses the same tag, and now the search returns four results. The test will fail, not because of anything that changed in the code but because of a change in the data.

That is what I mean by flaky tests in this instance. The tests needs to be a reliable indication of the health of the codebase, and this is not a way to achieve this end goal.

How to separate the data? The first step is easy, create a file called `tools-testing.json` and store it alongside the production file. But how do you know when to load which file?

Nodejs has a property called `NODE_ENV`, which reflects the current execution environment. When in production, its value will return `production`, and when run locally, it will return `development`. The problem is if I'm working on the site in development mode, I still want to use the production data. I only want to load the separate test database when executing the tests.

One option I explored was calling the `start` script as follows:

```bash
NODE_ENV=test react-scripts start
```

The idea was to couple this with an [environment file called `.env.test.local` following the documentation](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used) on create react app’s documentation website. The thing is, if you look at the docs, you will see this is only honored when you run `npm test`. Well, I do use `npm test` , but first, I start the web server using `npm start`. This means the server is going to ignore `.env.test.local`.

The next option is to use `.env.development.local` but that would mean it will always use the test data when I run in development mode. As mentioned earlier, this is not what I want.

I need a way to tell the code that it is in test mode without relying on these different environment files and `NODE_ENV`. After a lot of searching and many failed attempts, I finally resolved the problem.

## The solution

It turns out the developers of Playwright thought about this and have built-in support for this use case. One needs to dig a little deeper into the [Playwright configuration file documentation](https://playwright.dev/docs/api/class-testconfig). I looked here because I had another question to which I did not yet know the answer. When you [install Playwright](https://playwright.dev/docs/intro#installing-playwright) using, `npx init playwright@latest` it will create a [GitHub Actions](https://docs.github.com/en/actions) file if you opted in during installation.

The question I had was, how do you run these tests in your continuous integration (CI) pipeline? You do not want to run it against your production instance. I mean, you can run `npm start` followed by `npm test` to start up the development server. The problem is the development server will not yield to the test process but instead enter watch mode.

The answer to this question points to the solution for separating test and production data when writing tests. One can inform Playwright how to start your development server in the Playwright configuration file.

```js
// Run your local dev server before starting the tests \*/
webServer: {
  command: "npm start",
  port: 3000,
},
```

That answers the first question. What about the second? [Reading the documentation](https://playwright.dev/docs/api/class-testconfig#test-config-web-server), I learned about the `env` property one can specify as part of the `webServer` configuration. And what can you do with this? Well, you can pass environment variables to your app!

I updated the above configuration to the following:

```js
// Run your local dev server before starting the tests \*/
webServer: {
  command: "npm start",
  env: {
    REACT_APP_TESTING: "true",
  },
  port: 3000,
},
```

I now have a property that will only be set if Playwright starts the server! 🙌

Depending on your use case the `reuseExistingServer` option can also be useful, just be sure to read the docs about its use with CI. For me, this was not useful as I only want it to use the server started by Playwright and ignore any existing development server.

In the `useEffect` where the data is fetched, I now determine which file to load as follows:

```js
const jsonURL = process.env.REACT_APP_TESTING
  ? "/tools-test.json"
  : "/tools.json";
```

I tested this locally and on GitHub via the action, and the tests are running and passing as expected. I hope this saves someone else some time. Kudos to the Playwright developers and contributors for building this into the tool.
