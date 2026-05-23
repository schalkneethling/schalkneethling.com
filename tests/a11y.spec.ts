import fs from "node:fs/promises";
import type { TestInfo } from "@playwright/test";
import { formatFullReport } from "@schalkneethling/axe-aggregate-reporter";

import { test, expect } from "./fixtures/axe-test-fixture.js";
import urls from "./urls.json" with { type: "json" };

type TestUrl = {
  title: string;
  url: string;
};

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
