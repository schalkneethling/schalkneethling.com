import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { findBuiltPostProblems } from "../src/lib/builtPostVerification.ts";

const USAGE = `Usage: pnpm post:verify <post-slug> [--skip-build]

Runs the production build, then confirms the post page exists and the RSS
feed links to it. Use --skip-build to inspect an existing dist/ directory.`;

async function readOptionalFile(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "skip-build": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help || positionals.length !== 1) {
    console.log(USAGE);
    process.exit(values.help ? 0 : 1);
  }

  const slug = positionals[0];

  if (!values["skip-build"]) {
    const build = spawnSync("pnpm", ["run", "build"], { stdio: "inherit" });

    if (build.status !== 0) {
      console.error(`error: The production build failed.`);
      process.exit(build.status ?? 1);
    }
  }

  const problems = findBuiltPostProblems({
    slug,
    hasPostPage: await fileExists(`dist/posts/${slug}/index.html`),
    rssXml: await readOptionalFile("dist/rss.xml"),
  });

  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`error: ${problem}`);
    }

    process.exit(1);
  }

  console.log(`Verified: /posts/${slug}/ is built and listed in the RSS feed.`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
