import type {
  Reporter,
  FullConfig,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import fs from "node:fs/promises";
import path from "node:path";

type Aggregated = Array<{
  testId: string;
  title: string;
  status: TestResult["status"];
  axe?: unknown;
}>;

class AxeAggregateReporter implements Reporter {
  private outputDir: string;
  private rows: Aggregated = [];

  onBegin(config: FullConfig) {
    this.outputDir = config.rootDir;
    console.info("\nRunning accessibility tests and aggregating results...");
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const attachment = result.attachments.find(
      (attachment: TestResult["attachments"][number]) =>
        attachment.name === "axe.json" && attachment.path,
    );

    if (!attachment || !attachment.path) {
      return;
    }

    let axe: unknown;
    try {
      const raw = await fs.readFile(attachment.path, "utf-8");
      axe = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Failed to load or parse axe.json attachment for test ${test.title}`,
        { cause: error },
      );
    }

    this.rows.push({
      testId: test.id,
      title: test.title,
      status: result.status,
      axe,
    });

    console.info(`\n${test.title} completed`);
  }

  async onEnd() {
    const outputFile = path.join(this.outputDir, "full-report.json");
    await fs.writeFile(outputFile, JSON.stringify(this.rows, null, 2));
    console.log(`\nWrote full report to ${outputFile}\n`);
  }
}

export default AxeAggregateReporter;
