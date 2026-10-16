import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  DRAFTS_DIRECTORY,
  POSTS_DIRECTORY,
  formatUtcDate,
  planDraftPublication,
  resolveDraftFileName,
} from "../src/lib/draftPublishing.ts";

const USAGE = `Usage: pnpm post:publish <draft-slug> [--date YYYY-MM-DD] [--write]

Moves a draft from ${DRAFTS_DIRECTORY} to ${POSTS_DIRECTORY} and sets its
pubDate. Without --write, the command only prints the plan.`;

async function listMarkdownFiles(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
    .map((entry) => entry.name)
    .toSorted();
}

function fail(errors: readonly string[]): never {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  process.exit(1);
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      date: { type: "string" },
      write: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help || positionals.length !== 1) {
    console.log(USAGE);
    process.exit(values.help ? 0 : 1);
  }

  const resolution = resolveDraftFileName(
    positionals[0],
    await listMarkdownFiles(DRAFTS_DIRECTORY),
  );

  if (!resolution.ok) {
    fail(resolution.errors);
  }

  const draftPath = join(DRAFTS_DIRECTORY, resolution.draftFileName);
  const now = new Date();
  const result = planDraftPublication({
    draftFileName: resolution.draftFileName,
    draftSource: await readFile(draftPath, "utf8"),
    existingPostFileNames: await listMarkdownFiles(POSTS_DIRECTORY),
    publishDate: values.date ?? formatUtcDate(now),
    now,
  });

  if (!result.ok) {
    fail(result.errors);
  }

  const { plan } = result;
  const postPath = join(POSTS_DIRECTORY, plan.postFileName);

  console.log(`Title:   ${plan.title}`);
  console.log(`Move:    ${draftPath} -> ${postPath}`);
  console.log(`pubDate: ${plan.previousPubDate} -> ${plan.pubDate}`);
  console.log(`URL:     /posts/${plan.slug}/`);

  if (!values.write) {
    console.log("\nDRY RUN: no files changed. Re-run with --write to apply.");
    return;
  }

  // The "wx" flag refuses to overwrite a post created after planning.
  await writeFile(postPath, plan.source, { flag: "wx" });
  await rm(draftPath);

  console.log(`\nPublished ${postPath}. Next, verify the build:`);
  console.log(`  pnpm post:verify ${plan.slug}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
