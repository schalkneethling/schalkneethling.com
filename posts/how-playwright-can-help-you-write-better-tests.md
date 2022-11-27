---
title: How Playwright Can Help You Write Better Tests by Separating Test and Production Data
description: When running your Playwright tests, how do you load a different set of data based in the current execution environment?
---

One of the products we are developing at [Mechanical Ink](https://mechanical.ink) is called the [Developer Toolchest](https://developer-toolchest.com). You can think of it in two ways:

- A bookmarking tool where you store all of the online utilities, documentation, and anything developer related you use but tend to forget the name or URL. Developer Toolchest allows you to tag each tool you add and later search using those tags. For example, while you cannot remember the name or URL, you know it was a design tool. Searching for the design tag will list all tools tagged as design. (We have a feature on the roadmap to allow a user to limit results to [only those they added](https://github.com/schalkneethling/developer-toolchest/issues/230))
- The other way to use the Developer Toolchest is to find interesting tools for your needs. Maybe you are looking for a repl, a tool for image compression, or a javascript framework. Developer Toolchest is the perfect tool for this.

## The problem

The database of tools (currently managed via a JSON file, but we are considering moving it to MongoDB) is a community-driven initiative where everyone is welcome to contribute their tools of choice. The one thing we noticed is that the search functionality can be greatly improved.

We use an open-source module called [flexsearch](https://github.com/nextapps-de/flexsearch) to manage our index and search the index. The tool is incredibly well-written and is not the reason our search is not great. 😁 The reason is that we do not yet know how to wield its powers. Therefore, we decided to change that through an [exploratory project using Jest](https://github.com/schalkneethling/learning-flexsearch).

We have identified some areas where we are not using the tool correctly and are currently working on integrating our learnings to improve our search's effectiveness. This is where Playwright comes into play.

## Why Playwright?

While we implement the changes, we want to ensure we do not regress now or in the future. We also want to use Playwright in a [test-driven](<https://www.agilealliance.org/glossary/tdd/#q=~(infinite~false~filters~(postType~(~'page~'post~'aa_book~'aa_event_session~'aa_experience_report~'aa_glossary~'aa_research_paper~'aa_video)~tags~(~'tdd))~searchTerm~'~sort~false~sortDirection~'asc~page~1)>) manner. We immediately faced the challenge of separating the production data from the test data.

We do not want to test against the production JSON data, as it makes for flaky tests. Mainly because we will be testing against a moving target, so to speak. You want to control the data you are testing against to make the results predictable. If your tests suddenly start failing and you are testing against production data, it can simply be because the production data has changed. Say, for example, you have a test that opens the webpage, searches for a specific string, and expects three results. Tomorrow a contributor adds another tool that uses the same tag, and now the search returns four results. Your test will fail, not because of anything that changed in the code but because of a change in the data.

That is what we mean by flaky tests. Your tests need to be a reliable indication of the health of your codebase, and this is not how you achieve that end goal.

How do you separate the data? The first step is easy, create the file `tools-testing.json` that lives alongside the production file. But how do you know when to load which file?

Nodejs has a property called `NODE_ENV` , which reflects the current execution environment. When in production, its value will return `production` , and when run locally, it will return `development`. The problem is if we are working on the site in development mode, we still want to use the production data. We only want to load the separate test database when executing our tests.

One option we explored was calling our `start` script as follows:

```bash
NODE_ENV=test react-scripts start
```

The idea was to couple this with an environment file called `.env.test.local` [following the documentation](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used) on create react app’s documentation website. The thing is, if you look at the docs, you will see this is only honored when you run `npm test`. Well, we do use `npm test` , but first, we start the web server using `npm start`. This means the server is going to ignore `.env.test.local`.

The next option is to use `.env.development.local` but that would mean it will always use the test data when we run in development mode. As mentioned earlier, this is not what we want.

We need a way to tell the code that we are in test mode without relying on these different environment files and `NODE_ENV`. After a lot of searching and many failed attempts, we finally resolved the problem.

## The solution

It turns out the developers of Playwright thought about this and have built-in support for this use case. One needs to dig a little deeper into the Playwright [configuration file documentation](https://playwright.dev/docs/api/class-testconfig). We looked here because we had another question to which we did not yet know the answer. When you [install Playwright](https://playwright.dev/docs/intro#installing-playwright) using, `npx init playwright@latest` it would create a [GitHub Actions](https://docs.github.com/en/actions) file if you opted in during installation.

The question we had was, how do you run these tests in your continuous integration (CI) pipeline? You do not want to run it against your production instance. I mean, you can run `npm start` followed by `npm test` to start up the development server. The problem is the development server will not yield to the test process but instead enter watch mode. 🤔

The answer to this question is the same as how we separate test and production data when writing tests. You can inform Playwright how to start your development server in the Playwright configuration file.

```js
// Run your local dev server before starting the tests \*/
webServer: {
command: "npm start",
port: 3000,
},
```

That answers the first question. What about the second? [Reading the documentation](https://playwright.dev/docs/api/class-testconfig#test-config-web-server), we learned about the `env` property you can specify as part of the `webServer` configuration. And what can you do with this? Well, you can pass environment variables to your app! From the docs

Environment variables to set for the command, `process.env` by default.

We updated the above configuration to the following:

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

We now have a property that will only be set if Playwright starts the server! 🙌

Depending on your use case the `reuseExistingServer` option can also be useful, just be sure to read the docs about its use with CI. For us, this was not useful as we only want it to use the server started by Playwright and ignore any existing development server.

In our `useEffect` where we fetch our data, we now determine which file to load as follows:

```js
const jsonURL = process.env.REACT_APP_TESTING
  ? "/tools-test.json"
  : "/tools.json";
```

We tested this locally and on GitHub via the action, and our tests are running and passing as expected. We hope this saves someone else some time. Kudos to the Playwright developers and contributors for building this into the tool.
