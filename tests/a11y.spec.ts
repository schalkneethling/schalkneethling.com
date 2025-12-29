import fs from "node:fs/promises";
import type { AxeResults, NodeResult, Result } from "axe-core";
import type { TestInfo } from "@playwright/test";

import { test, expect } from "./fixtures/axe-test-fixture.js";
import urls from "./urls.json" assert { type: "json" };

type Impact = "minor" | "moderate" | "serious" | "critical" | "unknown";

type TestUrl = {
  title: string;
  url: string;
};

for (const url of urls as TestUrl[]) {
  test(`${url.title} should be accessible`, async ({
    page,
    makeAxeBuilder,
  }, testInfo: TestInfo) => {
    await page.goto(url.url, { waitUntil: "domcontentloaded" });

    const axeBuilder = makeAxeBuilder();
    const results = await axeBuilder.analyze();

    if (results.violations.length) {
      const file = testInfo.outputPath("axe.json");
      await fs.writeFile(
        file,
        JSON.stringify(formatViolations(results), null, 2),
      );
      testInfo.attach("axe.json", {
        path: file,
        contentType: "application/json",
      });
    }

    expect(results.violations).toEqual([]);
  });
}

const IMPACT_ORDER = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
  unknown: 4,
} as const;

function extractSuccessCriteriaId(tags: string[]) {
  // matches for example wcag241, wcag242, etc.
  return tags.filter((tag) => /^wcag\d{3}$/.test(tag));
}

function formatNodes(nodes: NodeResult[], limit = 10) {
  if (!nodes.length) {
    return [];
  }

  return nodes.slice(0, limit).map((node: NodeResult) => {
    return {
      summary: node.failureSummary ?? "No failure summary",
      html: node.html,
      impact: node.impact ?? "unknown",
    };
  });
}

function formatViolations(results: AxeResults) {
  const violations = results.violations.map((violation: Result) => ({
    id: violation.id,
    successCriteriaId: extractSuccessCriteriaId(violation.tags ?? []),
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    impact: (violation.impact ?? "unknown") as Impact,
    nodes: formatNodes(violation.nodes),
    totalNodes: violation.nodes.length,
  }));

  return violations.toSorted(
    (a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact],
  );
}
