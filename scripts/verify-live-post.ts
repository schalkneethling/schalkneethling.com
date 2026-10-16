import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  DEFAULT_SITE_URL,
  extractFrontmatterTitle,
  findLivePostProblems,
  parseRssItems,
  postPath,
  selectExistingPostSample,
  type CheckedPost,
  type FetchedPage,
  type LivePostProblem,
} from "../src/lib/livePostVerification.ts";

const POSTS_DIRECTORY = "src/content/posts";
const REQUEST_TIMEOUT_MS = 15_000;

const USAGE = `Usage: pnpm post:verify-live <post-slug...> [--site-url URL]

Checks the production site after a deploy. Each post must load with its title
and be linked from /blog, /rss.xml and, when it is one of the latest posts, the
homepage. A sample of existing posts must still load. The titles come from
${POSTS_DIRECTORY}, so run this from a checkout of the deployed commit.`;

export async function fetchPage(url: URL): Promise<FetchedPage> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "cache-control": "no-cache" },
    });

    return {
      url: url.href,
      status: response.status,
      body: await response.text(),
    };
  } catch (error) {
    const cause =
      error instanceof Error && error.cause instanceof Error
        ? error.cause
        : error;
    const message = cause instanceof Error ? cause.message : String(cause);

    return {
      url: url.href,
      status: undefined,
      body: undefined,
      error: message,
    };
  }
}

async function readPostTitle(slug: string) {
  for (const extension of [".md", ".mdx"]) {
    try {
      const source = await readFile(
        join(POSTS_DIRECTORY, `${slug}${extension}`),
        "utf8",
      );

      return extractFrontmatterTitle(source);
    } catch {
      // Try the next extension.
    }
  }

  return undefined;
}

export type LiveCheckRun =
  | { readonly ok: false; readonly unknownSlugs: string[] }
  | {
      readonly ok: true;
      readonly problems: LivePostProblem[];
      readonly newPosts: CheckedPost[];
      readonly sampledPosts: CheckedPost[];
    };

/** Fetches the production pages for the given posts and checks them. */
export async function runLiveChecks(
  slugs: readonly string[],
  siteUrl: string,
): Promise<LiveCheckRun> {
  const titles = await Promise.all(slugs.map(readPostTitle));
  const unknownSlugs = slugs.filter((_, index) => titles[index] === undefined);

  if (unknownSlugs.length > 0) {
    return { ok: false, unknownSlugs };
  }

  const pageUrl = (path: string) => new URL(path, siteUrl);
  const [blog, home, rss, ...newPostPages] = await Promise.all([
    fetchPage(pageUrl("/blog")),
    fetchPage(pageUrl("/")),
    fetchPage(pageUrl("/rss.xml")),
    ...slugs.map((slug) => fetchPage(pageUrl(postPath(slug)))),
  ]);

  const newPosts: CheckedPost[] = slugs.map((slug, index) => ({
    slug,
    title: titles[index] ?? "",
    page: newPostPages[index],
  }));

  const rssItems = rss.status === 200 ? parseRssItems(rss.body ?? "") : [];
  const sample = selectExistingPostSample(rssItems, slugs);
  const sampledPosts: CheckedPost[] = await Promise.all(
    sample.map(async ({ slug, title }) => ({
      slug,
      title,
      page: await fetchPage(pageUrl(postPath(slug))),
    })),
  );

  const problems = findLivePostProblems({
    siteUrl,
    newPosts,
    blog,
    home,
    rss,
    sampledPosts,
  });

  return { ok: true, problems, newPosts, sampledPosts };
}

export function printProblems(problems: readonly LivePostProblem[]) {
  for (const problem of problems) {
    console.error(`\nWhat failed:   ${problem.what}`);
    console.error(`Likely reason: ${problem.reason}`);
    console.error(`Next step:     ${problem.nextStep}`);
  }
}

export function printUnknownSlugs(unknownSlugs: readonly string[]) {
  for (const slug of unknownSlugs) {
    console.error(
      `error: No post with a title at ${POSTS_DIRECTORY}/${slug}.md or .mdx.`,
    );
  }
}

export function printVerifiedPosts(
  run: Extract<LiveCheckRun, { ok: true }>,
  siteUrl: string,
) {
  for (const { slug } of run.newPosts) {
    console.log(
      `Verified: ${new URL(postPath(slug), siteUrl).href} is live and listed.`,
    );
  }

  const sampleSlugs =
    run.sampledPosts.map(({ slug }) => slug).join(", ") || "none";
  console.log(`Existing posts still load: ${sampleSlugs}.`);
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "site-url": { type: "string", default: DEFAULT_SITE_URL },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help || positionals.length === 0) {
    console.log(USAGE);
    process.exit(values.help ? 0 : 1);
  }

  const siteUrl = values["site-url"];
  const run = await runLiveChecks([...new Set(positionals)], siteUrl);

  if (!run.ok) {
    printUnknownSlugs(run.unknownSlugs);
    process.exit(1);
  }

  if (run.problems.length > 0) {
    printProblems(run.problems);
    console.error(
      `\n${run.problems.length} production check(s) failed on ${siteUrl}.`,
    );
    process.exit(1);
  }

  printVerifiedPosts(run, siteUrl);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
