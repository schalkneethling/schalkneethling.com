import { describe, expect, it } from "vitest";

import { assertStandardSitePublisherDid } from "../src/lib/standardSiteAuth";

const publisherDid = "did:plc:brimpw7k46xczmr4pqst45df";

describe("Standard.site publisher authentication", () => {
  it("accepts the configured publisher DID", () => {
    expect(() =>
      assertStandardSitePublisherDid(publisherDid, publisherDid),
    ).not.toThrow();
  });

  it("fails closed when the publisher DID is not configured", () => {
    expect(() =>
      assertStandardSitePublisherDid(publisherDid, undefined),
    ).toThrow("publisher DID is not configured");
  });

  it("fails closed when the authenticated DID does not match", () => {
    expect(() =>
      assertStandardSitePublisherDid("did:plc:other", publisherDid),
    ).toThrow("does not match the configured DID");
  });
});
