import { describe, expect, it } from "vitest";

import {
  extractFrontmatterTitle,
  extractPageHeading,
  extractPostSlugs,
  findLivePostProblems,
  parseRssItems,
  selectExistingPostSample,
  type FetchedPage,
  type LiveSiteEvidence,
} from "../src/lib/livePostVerification";

const siteUrl = "https://schalkneethling.com";

function page(path: string, body: string, status = 200): FetchedPage {
  return { url: `${siteUrl}${path}`, status, body };
}

function postHtml(title: string) {
  return `<!doctype html><html><head><title>${title} - Schalk Neethling</title></head>
<body><main><article><h1>${title}</h1><p>Body</p></article></main></body></html>`;
}

function listingHtml(slugs: readonly string[]) {
  const items = slugs
    .map((slug) => `<li><a href="/posts/${slug}/">${slug}</a></li>`)
    .join("");

  return `<!doctype html><html><body><nav><a href="/blog">Blog</a></nav><ul>${items}</ul></body></html>`;
}

function rssXml(items: readonly { slug: string; title: string }[]) {
  const itemXml = items
    .map(
      ({ slug, title }) =>
        `<item><title>${title}</title><link>${siteUrl}/posts/${slug}/</link></item>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Feed</title><link>${siteUrl}/</link>${itemXml}</channel></rss>`;
}

const feedItems = [
  { slug: "new-post", title: "A New Post" },
  { slug: "second-post", title: "Second Post" },
  { slug: "third-post", title: "Third Post" },
  { slug: "fourth-post", title: "Fourth Post" },
];
const allSlugs = feedItems.map((item) => item.slug);

function healthyEvidence(): LiveSiteEvidence {
  return {
    siteUrl,
    newPosts: [
      {
        slug: "new-post",
        title: "A New Post",
        page: page("/posts/new-post/", postHtml("A New Post")),
      },
    ],
    blog: page("/blog", listingHtml(allSlugs)),
    home: page("/", listingHtml(allSlugs.slice(0, 3))),
    rss: page("/rss.xml", rssXml(feedItems)),
    sampledPosts: [
      {
        slug: "second-post",
        title: "Second Post",
        page: page("/posts/second-post/", postHtml("Second Post")),
      },
    ],
  };
}

function whatFailed(evidence: LiveSiteEvidence) {
  return findLivePostProblems(evidence).map((problem) => problem.what);
}

describe("extractPostSlugs", () => {
  it("returns post slugs from relative and same-origin absolute links in document order", () => {
    const html = `<a href="/posts/first/">First</a>
<a href="https://schalkneethling.com/posts/second/">Second</a>
<a href="/posts/first/">First again</a>
<a href="/blog">Blog</a>
<a href="/posts/third">Third without a trailing slash</a>`;

    expect(extractPostSlugs(html, siteUrl)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("ignores post links that point at another site", () => {
    const html = `<a href="https://example.com/posts/elsewhere/">Elsewhere</a>`;

    expect(extractPostSlugs(html, siteUrl)).toEqual([]);
  });
});

describe("parseRssItems", () => {
  it("returns each item's slug and decoded title in feed order", () => {
    const xml = rssXml([
      { slug: "first", title: "Tom &amp; Jerry" },
      { slug: "second", title: "Second" },
    ]);

    expect(parseRssItems(xml)).toEqual([
      { slug: "first", title: "Tom & Jerry" },
      { slug: "second", title: "Second" },
    ]);
  });

  it("matches feed links on their path so a preview server can be checked", () => {
    expect(
      parseRssItems(rssXml([{ slug: "first", title: "First" }])).map(
        (item) => item.slug,
      ),
    ).toEqual(["first"]);
    expect(
      extractPostSlugs(
        `<a href="/posts/first/">First</a>`,
        "http://localhost:4321",
      ),
    ).toEqual(["first"]);
  });

  it("does not mistake the channel link for a post", () => {
    expect(parseRssItems(rssXml([]))).toEqual([]);
  });
});

describe("extractPageHeading", () => {
  it("returns the first level-one heading with whitespace collapsed", () => {
    const html = `<h1>
      Understanding   <code>local()</code>
    </h1><h1>Another</h1>`;

    expect(extractPageHeading(html)).toBe("Understanding local()");
  });

  it("returns undefined when the page has no level-one heading", () => {
    expect(extractPageHeading("<p>No heading</p>")).toBeUndefined();
  });
});

describe("extractFrontmatterTitle", () => {
  it("reads the title from the frontmatter", () => {
    const source = `---\ntitle: "Tom & Jerry"\npubDate: 2026-10-16\n---\n\nBody\n`;

    expect(extractFrontmatterTitle(source)).toBe("Tom & Jerry");
  });

  it("returns undefined when there is no frontmatter title", () => {
    expect(extractFrontmatterTitle("Body only\n")).toBeUndefined();
    expect(extractFrontmatterTitle("---\npubDate: 2026-10-16\n---\n")).toBe(
      undefined,
    );
  });
});

describe("selectExistingPostSample", () => {
  it("takes the newest feed items that are not being verified as new", () => {
    expect(selectExistingPostSample(feedItems, ["new-post"], 2)).toEqual([
      { slug: "second-post", title: "Second Post" },
      { slug: "third-post", title: "Third Post" },
    ]);
  });
});

describe("findLivePostProblems", () => {
  it("reports nothing when every check passes", () => {
    expect(findLivePostProblems(healthyEvidence())).toEqual([]);
  });

  it("explains a new post that returns 404", () => {
    const evidence = healthyEvidence();
    evidence.newPosts[0].page = page("/posts/new-post/", "Not found", 404);

    expect(findLivePostProblems(evidence)).toContainEqual({
      what: "/posts/new-post/ returned 404.",
      reason:
        "The pubDate was after the build time, or the file is not in src/content/posts/.",
      nextStep: "Inspect the merged frontmatter and file location of new-post.",
    });
  });

  it("explains a page that could not be fetched at all", () => {
    const evidence = healthyEvidence();
    evidence.newPosts[0].page = {
      url: `${siteUrl}/posts/new-post/`,
      status: undefined,
      body: undefined,
      error: "getaddrinfo ENOTFOUND schalkneethling.com",
    };

    expect(findLivePostProblems(evidence)).toContainEqual({
      what: "/posts/new-post/ could not be fetched: getaddrinfo ENOTFOUND schalkneethling.com.",
      reason:
        "The site is unreachable from this machine, or the network blocks it.",
      nextStep:
        "Confirm the site loads in a browser and that this environment may reach schalkneethling.com, then run the checks again.",
    });
  });

  it("explains a new post whose title is not rendered", () => {
    const evidence = healthyEvidence();
    evidence.newPosts[0].page = page(
      "/posts/new-post/",
      postHtml("Something Else"),
    );

    expect(findLivePostProblems(evidence)).toContainEqual({
      what: '/posts/new-post/ returned 200 but its heading is "Something Else" instead of "A New Post".',
      reason: "A layout or MDX rendering problem.",
      nextStep:
        "Run pnpm post:verify locally and inspect the built page for new-post.",
    });
  });

  it("explains a new post missing from the blog listing", () => {
    const evidence = healthyEvidence();
    evidence.blog = page("/blog", listingHtml(allSlugs.slice(1)));

    expect(findLivePostProblems(evidence)).toEqual([
      {
        what: "/blog does not link to /posts/new-post/.",
        reason: "A listing filter, sort order, or limit, or a cached page.",
        nextStep:
          "Run the checks again to rule out caching, then inspect getPublishedPosts and the listing component.",
      },
    ]);
  });

  it("explains a new post missing from the RSS feed", () => {
    const evidence = healthyEvidence();
    evidence.rss = page("/rss.xml", rssXml(feedItems.slice(1)));
    // The feed decides which posts the homepage shows, so leave the homepage
    // matching the shortened feed to isolate the feed problem.
    evidence.home = page("/", listingHtml(allSlugs.slice(1)));

    expect(whatFailed(evidence)).toEqual([
      "/rss.xml does not link to /posts/new-post/.",
    ]);
  });

  it("expects the homepage to link to a new post among the latest posts", () => {
    const evidence = healthyEvidence();
    evidence.home = page("/", listingHtml(allSlugs.slice(1, 4)));

    expect(whatFailed(evidence)).toEqual([
      "The homepage does not link to /posts/new-post/, which is one of the 3 latest posts.",
    ]);
  });

  it("does not expect the homepage to link to an older new post", () => {
    const evidence = healthyEvidence();
    evidence.newPosts = [
      {
        slug: "fourth-post",
        title: "Fourth Post",
        page: page("/posts/fourth-post/", postHtml("Fourth Post")),
      },
    ];

    expect(findLivePostProblems(evidence)).toEqual([]);
  });

  it("reports an unavailable listing page once instead of once per post", () => {
    const evidence = healthyEvidence();
    evidence.newPosts.push({
      slug: "second-post",
      title: "Second Post",
      page: page("/posts/second-post/", postHtml("Second Post")),
    });
    evidence.blog = page("/blog", "Server error", 500);

    expect(whatFailed(evidence)).toEqual(["/blog returned 500."]);
  });

  it("explains a sampled existing post that regressed", () => {
    const evidence = healthyEvidence();
    evidence.sampledPosts[0].page = page(
      "/posts/second-post/",
      "Not found",
      404,
    );

    expect(findLivePostProblems(evidence)).toEqual([
      {
        what: "The existing post /posts/second-post/ returned 404.",
        reason: "The deploy regressed existing posts.",
        nextStep:
          "Republish the previous deploy in Netlify to roll back, then investigate the change.",
      },
    ]);
  });
});
