import { DOMParser } from "linkedom";
import { parse } from "yaml";

import { LATEST_POSTS_COUNT } from "./postFilters.ts";

export const DEFAULT_SITE_URL = "https://schalkneethling.com";
export const EXISTING_POST_SAMPLE_SIZE = 3;

const POST_PATH_PATTERN = /^\/posts\/(?<slug>[^/]+)\/?$/;
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * The outcome of one HTTP request. A request that never produced a response,
 * for example because DNS failed, has no status and carries the error instead.
 */
export type FetchedPage = {
  readonly url: string;
  readonly status: number | undefined;
  readonly body: string | undefined;
  readonly error?: string;
};

export type CheckedPost = {
  readonly slug: string;
  readonly title: string;
  page: FetchedPage;
};

export type LiveSiteEvidence = {
  readonly siteUrl: string;
  newPosts: CheckedPost[];
  blog: FetchedPage;
  home: FetchedPage;
  rss: FetchedPage;
  sampledPosts: CheckedPost[];
};

export type LivePostProblem = {
  readonly what: string;
  readonly reason: string;
  readonly nextStep: string;
};

export type RssItem = {
  readonly slug: string;
  readonly title: string;
};

const LISTING_PROBLEM = {
  reason: "A listing filter, sort order, or limit, or a cached page.",
  nextStep:
    "Run the checks again to rule out caching, then inspect getPublishedPosts and the listing component.",
} as const;

const UNREACHABLE_PROBLEM = {
  reason:
    "The site is unreachable from this machine, or the network blocks it.",
  nextStep:
    "Confirm the site loads in a browser and that this environment may reach schalkneethling.com, then run the checks again.",
} as const;

const UNEXPECTED_STATUS_PROBLEM = {
  reason: "The deploy, the CDN, or Netlify is serving an error.",
  nextStep:
    "Open the page in a browser and check the Netlify dashboard for the latest production deploy.",
} as const;

const REGRESSION_PROBLEM = {
  reason: "The deploy regressed existing posts.",
  nextStep:
    "Republish the previous deploy in Netlify to roll back, then investigate the change.",
} as const;

export function postPath(slug: string) {
  return `/posts/${slug}/`;
}

function collapseWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function slugFromUrl(href: string, siteUrl: string) {
  let url: URL;

  try {
    url = new URL(href, siteUrl);
  } catch {
    return undefined;
  }

  const isSameSite = url.origin === new URL(siteUrl).origin;

  if (!isSameSite) {
    return undefined;
  }

  return POST_PATH_PATTERN.exec(url.pathname)?.groups?.slug;
}

function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

/** The unique post slugs a page links to, in document order. */
export function extractPostSlugs(html: string, siteUrl: string) {
  const slugs = new Set<string>();

  for (const anchor of parseHtml(html).querySelectorAll("a[href]")) {
    const slug = slugFromUrl(anchor.getAttribute("href") ?? "", siteUrl);

    if (slug) {
      slugs.add(slug);
    }
  }

  return [...slugs];
}

/**
 * The posts in an RSS feed, in feed order, which is newest first. Feed links
 * always use the canonical site URL from astro.config.mjs, so they are matched
 * on their path alone. That keeps the check usable against a preview server.
 */
export function parseRssItems(xml: string): RssItem[] {
  const feed = new DOMParser().parseFromString(xml, "text/xml");
  const items: RssItem[] = [];

  for (const item of feed.querySelectorAll("item")) {
    const link = item.querySelector("link")?.textContent?.trim() ?? "";
    const slug = URL.canParse(link)
      ? POST_PATH_PATTERN.exec(new URL(link).pathname)?.groups?.slug
      : undefined;

    if (slug) {
      items.push({
        slug,
        title: collapseWhitespace(
          item.querySelector("title")?.textContent ?? "",
        ),
      });
    }
  }

  return items;
}

/** The text of the first level-one heading, which post pages use for the title. */
export function extractPageHeading(html: string) {
  const heading = parseHtml(html).querySelector("h1");

  return heading ? collapseWhitespace(heading.textContent ?? "") : undefined;
}

export function extractFrontmatterTitle(source: string) {
  const frontmatter = FRONTMATTER_PATTERN.exec(source);
  const data: unknown = frontmatter ? parse(frontmatter[1]) : undefined;
  const title =
    data && typeof data === "object" && "title" in data
      ? data.title
      : undefined;

  return typeof title === "string" ? title : undefined;
}

/** The newest feed items that are not among the posts being verified as new. */
export function selectExistingPostSample(
  rssItems: readonly RssItem[],
  newSlugs: readonly string[],
  size = EXISTING_POST_SAMPLE_SIZE,
) {
  return rssItems
    .filter((item) => !newSlugs.includes(item.slug))
    .slice(0, size);
}

function describePath(page: FetchedPage) {
  const url = new URL(page.url);

  return url.pathname === "/" ? "The homepage" : url.pathname;
}

function findFetchProblem(
  page: FetchedPage,
  label = describePath(page),
): LivePostProblem | undefined {
  if (page.status === undefined) {
    return {
      what: `${label} could not be fetched: ${page.error ?? "no response"}.`,
      ...UNREACHABLE_PROBLEM,
    };
  }

  if (page.status !== 200) {
    return {
      what: `${label} returned ${page.status}.`,
      ...UNEXPECTED_STATUS_PROBLEM,
    };
  }

  return undefined;
}

function findHeadingMismatch(post: CheckedPost) {
  const heading = extractPageHeading(post.page.body ?? "");

  if (heading === collapseWhitespace(post.title)) {
    return undefined;
  }

  const rendered =
    heading === undefined ? "has no level-one heading" : `is "${heading}"`;

  return `its heading ${rendered} instead of "${post.title}"`;
}

function findNewPostPageProblem(
  post: CheckedPost,
): LivePostProblem | undefined {
  const path = postPath(post.slug);

  if (post.page.status === 404) {
    return {
      what: `${path} returned 404.`,
      reason:
        "The pubDate was after the build time, or the file is not in src/content/posts/.",
      nextStep: `Inspect the merged frontmatter and file location of ${post.slug}.`,
    };
  }

  const fetchProblem = findFetchProblem(post.page, path);

  if (fetchProblem) {
    return fetchProblem;
  }

  const headingMismatch = findHeadingMismatch(post);

  if (headingMismatch) {
    return {
      what: `${path} returned 200 but ${headingMismatch}.`,
      reason: "A layout or MDX rendering problem.",
      nextStep: `Run pnpm post:verify locally and inspect the built page for ${post.slug}.`,
    };
  }

  return undefined;
}

function findSampledPostProblem(
  post: CheckedPost,
): LivePostProblem | undefined {
  const path = postPath(post.slug);
  const fetchProblem = findFetchProblem(post.page, path);

  if (fetchProblem?.reason === UNREACHABLE_PROBLEM.reason) {
    return fetchProblem;
  }

  if (fetchProblem) {
    return {
      what: `The existing post ${fetchProblem.what}`,
      ...REGRESSION_PROBLEM,
    };
  }

  const headingMismatch = findHeadingMismatch(post);

  if (headingMismatch) {
    return {
      what: `The existing post ${path} returned 200 but ${headingMismatch}.`,
      ...REGRESSION_PROBLEM,
    };
  }

  return undefined;
}

/**
 * Checks a production deploy for the posts it was meant to publish. Each new
 * post must render with its title and be linked from /blog, the RSS feed and,
 * when it is one of the latest posts, the homepage. A sample of existing posts
 * must still render, to catch a deploy that regressed the archive.
 */
export function findLivePostProblems(
  evidence: LiveSiteEvidence,
): LivePostProblem[] {
  const { siteUrl, newPosts, blog, home, rss, sampledPosts } = evidence;
  const problems: LivePostProblem[] = [];

  for (const post of newPosts) {
    const pageProblem = findNewPostPageProblem(post);

    if (pageProblem) {
      problems.push(pageProblem);
    }
  }

  const blogProblem = findFetchProblem(blog);
  const rssProblem = findFetchProblem(rss);
  const homeProblem = findFetchProblem(home);

  for (const problem of [blogProblem, rssProblem, homeProblem]) {
    if (problem) {
      problems.push(problem);
    }
  }

  const blogSlugs = blogProblem
    ? []
    : extractPostSlugs(blog.body ?? "", siteUrl);
  const rssSlugs = rssProblem
    ? []
    : parseRssItems(rss.body ?? "").map((item) => item.slug);
  const homeSlugs = homeProblem
    ? []
    : extractPostSlugs(home.body ?? "", siteUrl);
  const latestSlugs = rssSlugs.slice(0, LATEST_POSTS_COUNT);

  for (const { slug } of newPosts) {
    const path = postPath(slug);
    const isMissingFromBlog = !blogProblem && !blogSlugs.includes(slug);
    const isMissingFromRss = !rssProblem && !rssSlugs.includes(slug);
    // The feed and the homepage share one sort order, so the feed tells us
    // whether the homepage should list this post.
    const isMissingFromHome =
      !homeProblem && latestSlugs.includes(slug) && !homeSlugs.includes(slug);

    if (isMissingFromBlog) {
      problems.push({
        what: `/blog does not link to ${path}.`,
        ...LISTING_PROBLEM,
      });
    }

    if (isMissingFromRss) {
      problems.push({
        what: `/rss.xml does not link to ${path}.`,
        ...LISTING_PROBLEM,
      });
    }

    if (isMissingFromHome) {
      problems.push({
        what: `The homepage does not link to ${path}, which is one of the ${LATEST_POSTS_COUNT} latest posts.`,
        ...LISTING_PROBLEM,
      });
    }
  }

  for (const post of sampledPosts) {
    const sampleProblem = findSampledPostProblem(post);

    if (sampleProblem) {
      problems.push(sampleProblem);
    }
  }

  return problems;
}
