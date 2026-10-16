import { describe, expect, it } from "vitest";

import { findBuiltPostProblems } from "../src/lib/builtPostVerification";

const rssXml = `<rss><channel>
<item><title>Example</title><link>https://schalkneethling.com/posts/example-post/</link></item>
</channel></rss>`;

describe("findBuiltPostProblems", () => {
  it("reports nothing when the page is built and listed in the feed", () => {
    expect(
      findBuiltPostProblems({
        slug: "example-post",
        hasPostPage: true,
        rssXml,
      }),
    ).toEqual([]);
  });

  it("reports a post page missing from the build", () => {
    expect(
      findBuiltPostProblems({
        slug: "example-post",
        hasPostPage: false,
        rssXml,
      }),
    ).toEqual([
      "The build did not produce dist/posts/example-post/index.html.",
    ]);
  });

  it("reports a post missing from the RSS feed", () => {
    expect(
      findBuiltPostProblems({
        slug: "another-post",
        hasPostPage: true,
        rssXml,
      }),
    ).toEqual(["dist/rss.xml does not link to /posts/another-post/."]);
  });

  it("does not treat a longer slug with the same prefix as a match", () => {
    expect(
      findBuiltPostProblems({
        slug: "example",
        hasPostPage: true,
        rssXml,
      }),
    ).toEqual(["dist/rss.xml does not link to /posts/example/."]);
  });

  it("reports a missing feed", () => {
    expect(
      findBuiltPostProblems({
        slug: "example-post",
        hasPostPage: true,
        rssXml: undefined,
      }),
    ).toEqual(["The build did not produce dist/rss.xml."]);
  });
});
