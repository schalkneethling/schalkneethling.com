import { describe, expect, it } from "vitest";

import { postStandardSiteSchema } from "../src/lib/postStandardSiteSchema";

const documentAtUri =
  "at://did:plc:example/site.standard.document/example-post";

describe("postStandardSiteSchema", () => {
  it.each([
    { publish: false },
    { publish: false, documentAtUri },
    { publish: true },
    { publish: true, documentAtUri },
  ])("accepts the documented state %#", (standardSite) => {
    expect(postStandardSiteSchema.parse(standardSite)).toEqual(standardSite);
  });

  it("requires an explicit publish selection", () => {
    expect(() => postStandardSiteSchema.parse({ documentAtUri })).toThrow();
  });

  it("rejects a malformed document AT-URI", () => {
    expect(() =>
      postStandardSiteSchema.parse({
        publish: true,
        documentAtUri: "https://schalkneethling.com/posts/example-post/",
      }),
    ).toThrow("Expected a site.standard.document AT-URI");
  });

  it.each([
    "at://bad authority/site.standard.document/example-post",
    "at:///site.standard.document/example-post",
  ])("rejects the invalid authority in %s", (documentAtUri) => {
    expect(() =>
      postStandardSiteSchema.parse({ publish: true, documentAtUri }),
    ).toThrow("Expected a site.standard.document AT-URI");
  });

  it.each([`${documentAtUri}?view=full`, `${documentAtUri}#content`])(
    "rejects the query or fragment in %s",
    (documentAtUri) => {
      expect(() =>
        postStandardSiteSchema.parse({ publish: true, documentAtUri }),
      ).toThrow("Expected a site.standard.document AT-URI");
    },
  );
});
