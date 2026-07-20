import { describe, expect, it } from "vitest";

import { createStandardSitePlan } from "../scripts/generate-standard-site-records";
import { standardSite } from "../src/lib/standardSite";

const post = {
  id: "example-post",
  data: {
    title: "Example post",
    description: "An example.",
    pubDate: new Date("2026-07-01T00:00:00.000Z"),
    tags: ["atproto"],
    standardSite: { publish: true },
  },
};

describe("Standard.site dry-run plan", () => {
  it("plans creates from missing local identifiers", () => {
    const plan = createStandardSitePlan([post], standardSite);

    expect(plan.publication.action).toBe("create");
    expect(plan.documents[0]).toMatchObject({
      id: "example-post",
      action: "create",
      reason: "document AT-URI missing",
      payload: { $type: "site.standard.document" },
    });
  });

  it("plans updates from configured local identifiers", () => {
    const documentAtUri =
      "at://did:plc:example/site.standard.document/example-post";
    const selectedPost = {
      ...post,
      data: {
        ...post.data,
        standardSite: { publish: true, documentAtUri },
      },
    };

    expect(createStandardSitePlan([selectedPost]).documents[0]).toMatchObject({
      action: "update",
      documentAtUri,
    });
  });

  it.each([
    ["not selected", undefined],
    ["publishing disabled", { publish: false }],
  ])("plans a skip when a post is %s", (reason, standardSiteMetadata) => {
    const skippedPost = {
      ...post,
      data: { ...post.data, standardSite: standardSiteMetadata },
    };

    expect(createStandardSitePlan([skippedPost]).documents[0]).toEqual({
      id: "example-post",
      action: "skip",
      reason,
    });
  });

  it("excludes future posts from the plan", () => {
    const futurePost = {
      ...post,
      data: { ...post.data, pubDate: new Date("2999-01-01T00:00:00.000Z") },
    };

    expect(createStandardSitePlan([futurePost]).documents).toEqual([]);
  });
});
