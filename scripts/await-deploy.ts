import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  DEPLOY_MARKER_PATH,
  describeDeployTimeout,
  waitForDeploy,
} from "../src/lib/deployWait.ts";
import { DEFAULT_SITE_URL } from "../src/lib/livePostVerification.ts";
import {
  fetchPage,
  printProblems,
  printUnknownSlugs,
  printVerifiedPosts,
  runLiveChecks,
} from "./verify-live-post.ts";

const DEFAULT_TIMEOUT_MINUTES = 15;
const DEFAULT_INTERVAL_SECONDS = 20;
// The CDN can serve a cached listing for a short while after the deploy, so
// failed checks are retried before they are reported.
const CHECK_ATTEMPTS = 3;
const CHECK_RETRY_DELAY_MS = 30_000;

const USAGE = `Usage: pnpm post:await-deploy <commit> [post-slug...] [options]

Waits until production serves <commit> (or a later commit that contains it)
at ${DEPLOY_MARKER_PATH}, then runs pnpm post:verify-live for each post slug.

Options:
  --site-url URL           Site to watch (default ${DEFAULT_SITE_URL})
  --timeout-minutes N      How long to wait for the deploy (default ${DEFAULT_TIMEOUT_MINUTES})
  --interval-seconds N     How often to check (default ${DEFAULT_INTERVAL_SECONDS})`;

function git(args: readonly string[]) {
  return spawnSync("git", args, { encoding: "utf8" });
}

/** Expands a short SHA, branch, or HEAD to a full SHA when git knows it. */
function resolveCommit(commit: string) {
  const result = git([
    "rev-parse",
    "--verify",
    "--quiet",
    `${commit}^{commit}`,
  ]);

  return result.status === 0 ? result.stdout.trim() : commit;
}

function isAncestor(ancestor: string, descendant: string) {
  return (
    git(["merge-base", "--is-ancestor", ancestor, descendant]).status === 0
  );
}

function parsePositiveNumber(value: string, option: string) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    console.error(`error: ${option} must be a positive number.`);
    process.exit(1);
  }

  return number;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "site-url": { type: "string", default: DEFAULT_SITE_URL },
      "timeout-minutes": {
        type: "string",
        default: String(DEFAULT_TIMEOUT_MINUTES),
      },
      "interval-seconds": {
        type: "string",
        default: String(DEFAULT_INTERVAL_SECONDS),
      },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help || positionals.length === 0) {
    console.log(USAGE);
    process.exit(values.help ? 0 : 1);
  }

  const siteUrl = values["site-url"];
  const [commit, ...slugs] = positionals;
  const expectedSha = resolveCommit(commit);
  const timeoutMs =
    parsePositiveNumber(values["timeout-minutes"], "--timeout-minutes") *
    60_000;
  const intervalMs =
    parsePositiveNumber(values["interval-seconds"], "--interval-seconds") *
    1_000;
  const markerUrl = new URL(DEPLOY_MARKER_PATH, siteUrl);

  console.log(`Waiting for ${markerUrl.href} to serve ${expectedSha}...`);

  const result = await waitForDeploy({
    expectedSha,
    fetchMarker: () => fetchPage(markerUrl),
    isAncestor,
    now: Date.now,
    sleep: (ms) => sleep(ms),
    timeoutMs,
    intervalMs,
  });

  if (result.outcome === "timeout") {
    printProblems([
      describeDeployTimeout({
        expectedSha,
        timeoutMs,
        lastReading: result.lastReading,
      }),
    ]);
    process.exit(1);
  }

  const seconds = Math.round(result.elapsedMs / 1_000);
  console.log(`Deployed: production serves ${result.servedSha} (${seconds}s).`);

  if (slugs.length === 0) {
    return;
  }

  const uniqueSlugs = [...new Set(slugs)];

  for (let attempt = 1; attempt <= CHECK_ATTEMPTS; attempt++) {
    const run = await runLiveChecks(uniqueSlugs, siteUrl);

    if (!run.ok) {
      printUnknownSlugs(run.unknownSlugs);
      process.exit(1);
    }

    if (run.problems.length === 0) {
      printVerifiedPosts(run, siteUrl);
      return;
    }

    if (attempt === CHECK_ATTEMPTS) {
      printProblems(run.problems);
      console.error(
        `\n${run.problems.length} production check(s) still failed after ${CHECK_ATTEMPTS} attempts on ${siteUrl}.`,
      );
      process.exit(1);
    }

    console.log(
      `${run.problems.length} check(s) failed on attempt ${attempt}; retrying in ${CHECK_RETRY_DELAY_MS / 1_000}s in case the CDN is still serving cached pages.`,
    );
    await sleep(CHECK_RETRY_DELAY_MS);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
