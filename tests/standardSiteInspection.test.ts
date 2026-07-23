import { describe, expect, it } from "vitest";

import { standardSite } from "../src/lib/standardSite";
import {
  inspectStandardSiteRecord,
  type StandardSiteRecordReference,
} from "../src/lib/standardSiteInspection";

const publisherDid = "did:plc:brimpw7k46xczmr4pqst45df";
const reference = {
  source: "publication configuration",
  atUri: `at://${publisherDid}/site.standard.publication/3mabcde123k2`,
  collection: "site.standard.publication",
} as const satisfies StandardSiteRecordReference;

describe("Standard.site read-only inspection", () => {
  it("validates and reports an existing record and CID", async () => {
    await expect(
      inspectStandardSiteRecord(reference, publisherDid, async (params) => {
        expect(params).toEqual({
          repo: publisherDid,
          collection: reference.collection,
          rkey: "3mabcde123k2",
        });
        return {
          uri: reference.atUri,
          cid: "bafyreiexample",
          value: standardSite.record,
        };
      }),
    ).resolves.toEqual({
      ...reference,
      status: "found",
      cid: "bafyreiexample",
    });
  });

  it("reports a configured record that is missing remotely", async () => {
    await expect(
      inspectStandardSiteRecord(reference, publisherDid, async () => undefined),
    ).resolves.toEqual({ ...reference, status: "missing" });
  });

  it("fails before inspection when the configured record has another owner", async () => {
    const getRecord = async () => {
      throw new Error("should not be called");
    };

    await expect(
      inspectStandardSiteRecord(
        {
          ...reference,
          atUri: "at://did:plc:other/site.standard.publication/3mabcde123k2",
        },
        publisherDid,
        getRecord,
      ),
    ).rejects.toThrow("is owned by did:plc:other");
  });

  it("rejects a remote record without a CID", async () => {
    await expect(
      inspectStandardSiteRecord(reference, publisherDid, async () => ({
        uri: reference.atUri,
        value: standardSite.record,
      })),
    ).rejects.toThrow("expected AT-URI and CID");
  });
});
