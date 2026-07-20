import { describe, expect, it } from "vitest";

import {
  createPublicationVerificationResponse,
  getPublicationDiscoveryLink,
  getPublicationVerificationPaths,
} from "../src/lib/standardSiteVerification";

const publicationAtUri =
  "at://did:plc:example/site.standard.publication/schalkneethling-com";

describe("Standard.site publication verification", () => {
  it("does not add a discovery link without a publication AT-URI", () => {
    expect(getPublicationDiscoveryLink(undefined)).toBeUndefined();
  });

  it("adds the publication discovery link when configured", () => {
    expect(getPublicationDiscoveryLink(publicationAtUri)).toEqual({
      rel: "site.standard.publication",
      href: publicationAtUri,
    });
  });

  it("does not generate an endpoint without a publication AT-URI", () => {
    expect(getPublicationVerificationPaths(undefined)).toEqual([]);
  });

  it("generates the well-known endpoint when configured", () => {
    expect(getPublicationVerificationPaths(publicationAtUri)).toEqual([
      {
        params: { publication: "site.standard.publication" },
        props: { publicationAtUri },
      },
    ]);
  });

  it("returns the publication AT-URI as plain text", async () => {
    const response = createPublicationVerificationResponse(publicationAtUri);

    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(await response.text()).toBe(publicationAtUri);
  });
});
