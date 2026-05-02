import { describe, expect, it } from "vitest";

import { isPublishedPost, sortPostsByPubDateDesc } from "../src/lib/postFilters";

describe("isPublishedPost", () => {
  const now = new Date("2026-05-02T12:00:00.000Z");

  it("includes posts published before the build time", () => {
    const post = { data: { pubDate: new Date("2026-05-01T12:00:00.000Z") } };

    expect(isPublishedPost(post, now)).toBe(true);
  });

  it("includes posts published at the build time", () => {
    const post = { data: { pubDate: new Date("2026-05-02T12:00:00.000Z") } };

    expect(isPublishedPost(post, now)).toBe(true);
  });

  it("excludes posts published after the build time", () => {
    const post = { data: { pubDate: new Date("2026-05-03T12:00:00.000Z") } };

    expect(isPublishedPost(post, now)).toBe(false);
  });
});

describe("sortPostsByPubDateDesc", () => {
  it("sorts posts from newest to oldest without mutating the input", () => {
    const oldest = { id: "oldest", data: { pubDate: new Date("2026-05-01") } };
    const newest = { id: "newest", data: { pubDate: new Date("2026-05-03") } };
    const middle = { id: "middle", data: { pubDate: new Date("2026-05-02") } };
    const posts = [oldest, newest, middle];

    expect(sortPostsByPubDateDesc(posts).map((post) => post.id)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
    expect(posts.map((post) => post.id)).toEqual(["oldest", "newest", "middle"]);
  });
});

