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
} from "../src/lib/livePostVerification.ts";

const POSTS_DIRECTORY = "src/content/posts";
const REQUEST_TIMEOUT_MS = 15_000;

const USAGE = `Usage: pnpm post:verify-live <post-slug...> [--site-url URL]

Checks the production site after a deploy. Each post must load with its title
and be linked from /blog, /rss.xml and, when it is one of the latest posts, the
homepage. A sample of existing posts must still load. The titles come from
${POSTS_DIRECTORY}, so run this from a checkout of the deployed commit.`;

async function fetchPage(url: URL): Promise<FetchedPage> {
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
  const slugs = [...new Set(positionals)];
  const titles = await Promise.all(slugs.map(readPostTitle));
  const unknownSlugs = slugs.filter((_, index) => titles[index] === undefined);

  if (unknownSlugs.length > 0) {
    for (const slug of unknownSlugs) {
      console.error(
        `error: No post with a title at ${POSTS_DIRECTORY}/${slug}.md or .mdx.`,
      );
    }

    process.exit(1);
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

  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`\nWhat failed:   ${problem.what}`);
      console.error(`Likely reason: ${problem.reason}`);
      console.error(`Next step:     ${problem.nextStep}`);
    }

    console.error(
      `\n${problems.length} production check(s) failed on ${siteUrl}.`,
    );
    process.exit(1);
  }

  for (const { slug } of newPosts) {
    console.log(
      `Verified: ${pageUrl(postPath(slug)).href} is live and listed.`,
    );
  }

  const sampleSlugs = sampledPosts.map(({ slug }) => slug).join(", ") || "none";
  console.log(`Existing posts still load: ${sampleSlugs}.`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
