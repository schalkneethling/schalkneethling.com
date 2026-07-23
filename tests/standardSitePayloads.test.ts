import { describe, expect, it } from "vitest";

import { standardSite } from "../src/lib/standardSite";
import {
  createDocumentPayloads,
  createPublicationPayload,
} from "../src/lib/standardSitePayloads";

const selectedPost = {
  id: "selected-post",
  data: {
    title: "Selected post",
    description: "A selected post.",
    pubDate: new Date("2026-07-20T08:30:00.000Z"),
    tags: ["atproto", "open-web"],
    standardSite: { publish: true },
  },
};

describe("Standard.site publication payload", () => {
  it("uses the typed publication record", () => {
    expect(createPublicationPayload(standardSite)).toBe(standardSite.record);
  });
});

describe("Standard.site document payloads", () => {
  it("maps selected post metadata", () => {
    expect(createDocumentPayloads([selectedPost], standardSite)).toEqual([
      {
        $type: "site.standard.document",
        site: standardSite.identity.publicationAtUri,
        path: "/posts/selected-post/",
        title: "Selected post",
        description: "A selected post.",
        publishedAt: "2026-07-20T08:30:00.000Z",
        tags: ["atproto", "open-web"],
      },
    ]);
  });

  it("uses the publication AT-URI when one is configured", () => {
    const config = {
      ...standardSite,
      identity: {
        ...standardSite.identity,
        publicationAtUri:
          "at://did:plc:example/site.standard.publication/schalkneethling-com",
      },
    };

    expect(createDocumentPayloads([selectedPost], config)[0]?.site).toBe(
      config.identity.publicationAtUri,
    );
  });

  it("honors an equivalent same-origin canonical URL", () => {
    const post = {
      ...selectedPost,
      data: {
        ...selectedPost.data,
        canonical:
          "https://SCHALKNEETHLING.com:443/writing/selected/?ref=archive",
      },
    };

    expect(createDocumentPayloads([post], standardSite)[0]?.path).toBe(
      "/writing/selected/?ref=archive",
    );
  });

  it("derives canonical eligibility from the configured publication URL", () => {
    const config = {
      ...standardSite,
      record: { ...standardSite.record, url: "https://example.com" },
    };
    const post = {
      ...selectedPost,
      data: {
        ...selectedPost.data,
        canonical: "https://example.com/writing/selected/",
      },
    };

    expect(createDocumentPayloads([post], config)[0]?.path).toBe(
      "/writing/selected/",
    );
  });

  it.each([
    ["has no explicit selection", undefined],
    ["is explicitly paused", { publish: false }],
  ])("skips a post that %s", (_description, standardSiteMetadata) => {
    const post = {
      ...selectedPost,
      data: { ...selectedPost.data, standardSite: standardSiteMetadata },
    };

    expect(createDocumentPayloads([post], standardSite)).toEqual([]);
  });

  it.each([
    "https://dev.to/schalkneethling/selected-post",
    "http://schalkneethling.com/posts/selected-post/",
    "https://schalkneethling.com:8443/posts/selected-post/",
  ])("skips an ineligible canonical URL: %s", (canonical) => {
    const post = {
      ...selectedPost,
      data: { ...selectedPost.data, canonical },
    };

    expect(createDocumentPayloads([post], standardSite)).toEqual([]);
  });

  it("rejects an invalid canonical URL", () => {
    const post = {
      ...selectedPost,
      data: { ...selectedPost.data, canonical: "not a URL" },
    };

    expect(() => createDocumentPayloads([post], standardSite)).toThrow(
      "Invalid URL",
    );
  });

  it("orders payloads deterministically by post id", () => {
    const anotherPost = {
      ...selectedPost,
      id: "another-post",
      data: { ...selectedPost.data, title: "Another post" },
    };

    expect(
      createDocumentPayloads([selectedPost, anotherPost], standardSite).map(
        (payload) => payload.title,
      ),
    ).toEqual(["Another post", "Selected post"]);
  });

  it("uses locale-independent code-unit ordering for non-ASCII ids", () => {
    const posts = [
      { ...selectedPost, id: "ä-post" },
      { ...selectedPost, id: "z-post" },
    ];

    expect(
      createDocumentPayloads(posts, standardSite).map(
        (payload) => payload.path,
      ),
    ).toEqual(["/posts/z-post/", "/posts/%C3%A4-post/"]);
  });
});
