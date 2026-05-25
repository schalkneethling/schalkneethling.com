---
title: "Announcing Axe Aggregate Reporter: run, report, view, and share a11y results"
pubDate: 2026-05-25
description: "A Playwright reporter paired with a dependency-free viewer that turns axe accessibility results into one report your team can actually read, share, and act on."
author: "Schalk Neethling"
tags: ["accessibility", "testing"]
---

If you test for accessibility in a Playwright suite, you have most likely reached for [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright). The [axe-core](https://github.com/dequelabs/axe-core) engine does the analysis, Playwright drives the browser, and your accessibility specs run alongside the rest of your tests.

The awkward part comes after the run. Each test tends to attach a JSON blob, or violations end up buried in a failing test log. That is fine for a machine, but it is not something you can comfortably hand to a teammate. When a colleague asks what is actually broken, you do not have a clear and shareable answer. You have a folder of attachments, or a wall of console output, and the work of turning that into a review still belongs to you.

That gap is what the Axe Aggregate Reporter is meant to close, and today I am sharing the first beta.

## What it actually is

The name says reporter, and that is only half the story. Axe Aggregate Reporter is two things working together: a Playwright reporter that writes a single, stable aggregate JSON file, and a dependency-free [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) viewer that renders that file as a focused accessibility findings report.

So it is a reporter and a viewer. Put the two together, and you have a small pipeline: run your axe tests, aggregate the results into one report, view that report as a clean visual page, and share it with the people who need it. Let me take you through each step.

## Step one: run axe with Playwright

Start by installing the package alongside your existing Playwright and axe dependencies.

```
pnpm add --save-dev @schalkneethling/axe-aggregate-reporter @axe-core/playwright @playwright/test
```

The axe setup stays in your project, which is deliberate. You should be the one choosing the [WCAG](https://www.w3.org/TR/WCAG22/) tags and any project-specific axe options, not the tool. A small fixture keeps that configuration in one place:

```ts
import { test as base } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

type AxeTestFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeTestFixture>({
  makeAxeBuilder: async (
    { page },
    use: (r: () => AxeBuilder) => Promise<void>,
  ) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .options({ reporter: "v2" })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
    await use(makeAxeBuilder);
  },
});

export { expect } from "@playwright/test";
```

Each accessibility spec then uses that fixture, runs the analysis, and attaches a formatted report named `axe.json`:

```js
import fs from "node:fs/promises";
import { formatFullReport } from "@schalkneethling/axe-aggregate-reporter";
import { test, expect } from "./fixtures/axe-test-fixture.js";

for (const url of urls as TestUrl[]) {
  test(`${url.title} should be accessible`, async ({
    page,
    makeAxeBuilder,
  }, testInfo: TestInfo) => {
    await page.goto(url.url, { waitUntil: "load" });
    await page.waitForLoadState("networkidle");

    const axeBuilder = makeAxeBuilder();
    const results = await axeBuilder.analyze();

    const file = testInfo.outputPath("axe.json");
    await fs.writeFile(
      file,
      JSON.stringify(formatFullReport(results), null, 2),
    );
    await testInfo.attach("axe.json", {
      path: file,
      contentType: "application/json",
    });

    expect(results.violations).toEqual([]);
  });
}
```

The `axe.json` attachment is the contract. The reporter only picks up tests that attach one, so the rest of your Playwright suite, including integration, end-to-end, and visual regression tests, can run in the same repository without showing up in your accessibility report.

## Step two: aggregate the report

Register the reporter in your Playwright configuration, next to whichever console reporter you already use:

```js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [["list"], ["@schalkneethling/axe-aggregate-reporter/reporter"]],
});
```

One note worth repeating: if your project runs more than accessibility specs, add this reporter to the config or npm script that runs your Axe tests rather than making it the default reporter for every suite. When the run finishes, the reporter writes a single `full-report.json` file to your root directory. That one file is the artifact that everything else builds on.

## Step three: view the report

This is the part the name does not advertise. Point the bundled viewer at the report:

```
pnpm exec axe-aggregate-viewer ./full-report.json
```

The command starts a small static server and opens the viewer in your browser. Instead of raw JSON, you get a summary, test-level sections, failed and passed checks, impact labels, the affected node targets, the check messages, and links straight to the Deque help pages for remediation guidance. It is the review you would otherwise have assembled by hand.

The viewer is a custom element, so the command line is not the only way to use it. If you already publish a static page, an internal dashboard, or a place where you gather CI artifacts, you can embed the `<axe-aggregate-reporter>` element directly and let it render the report in place.

The viewer assets ship inside the package. In an installed project, you will find them at `node_modules/@schalkneethling/axe-aggregate-reporter/css/axe-aggregate-reporter.css` and the matching `js/axe-aggregate-reporter.js`. Copy those two files into your static site, or serve the package directory through your build tool, then point the `href` and `src` at wherever your page serves them:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accessibility report</title>
    <link rel="stylesheet" href="/vendor/axe-aggregate-reporter/axe-aggregate-reporter.css" />
  </head>
  <body>
    <axe-aggregate-reporter src="./full-report.json"></axe-aggregate-reporter>
    <script type="module" src="/vendor/axe-aggregate-reporter/axe-aggregate-reporter.js"></script>
  </body>
</html>
```

The element fetches `full-report.json` and renders it exactly as the command-line triggered viewer does. The viewer itself is dependency-free and intentionally static: one JavaScript-backed custom element and a stylesheet, with no framework or runtime behind it.

## Step four: share the report

A local server is fine for your own review, but it does not help a teammate who is not on your machine. For that, export a standalone page:

```
pnpm exec axe-aggregate-viewer ./full-report.json --standalone
```

This writes a single self-contained HTML file. The viewer CSS, JavaScript, icons, and the report JSON are all inlined, with the report data embedded in an inert `<script type="application/json">` block. The page fetches nothing. You can open it with a double click, and it works the same on any machine.

A single, self-contained HTML file is also exactly the kind of thing my [Ephemeral Pages](https://ephemeral.schalkneethling.com/) project was built for. Ephemeral Pages publishes short-lived HTML pages that expire automatically, and the published pages carry a `noindex` directive, so they stay out of search engine results. Upload the standalone report, choose how long the link should live, and share the URL with your team. They get the full visual report, the link is private to whoever you send it to, and it disappears on the schedule you set. For an accessibility audit of a pre-release feature or a client project, that combination is genuinely useful.

## Accessibility, on both sides

It would be a poor look for an accessibility tool to ship an inaccessible report, so the viewer is built on semantic, structured markup, and the findings are presented as readable, dense audit data rather than decorative dashboards. If I missed something or if something should be improved, please let me know.

It also helps you act on what it shows. The viewer prioritises failed checks because that is what needs your attention first, but it keeps passed checks visible because the formatter preserves them, and a record of what passed has its own value. Every finding carries its impact label, the specific node targets axe matched, the check message, and a link to the Deque documentation for that rule, so the path from a finding to a fix is short.

## This is a beta, and your feedback matters

If you already use Playwright with `@axe-core/playwright` and the review step has been a chore, I would like you to try this and tell me where it falls short. Issues, ideas, and contributions are all welcome on the [GitHub repository](https://github.com/schalkneethling/axe-aggregate-reporter). The goal of a beta is to find the rough edges with you, and a tool like this gets better faster when the people running real accessibility suites use it and find the use cases and edge cases I missed, and where it falls short.

## Further reading

- [axe-aggregate-reporter on GitHub](https://github.com/schalkneethling/axe-aggregate-reporter)
- [Ephemeral Pages](https://ephemeral.schalkneethling.com/) — HTML with a TTL
- [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Playwright test reporters](https://playwright.dev/docs/test-reporters)
- [Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) on MDN Web Docs
- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
