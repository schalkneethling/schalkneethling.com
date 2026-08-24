import { Client } from "@atproto/lex";
import { describe, expect, it } from "vitest";

import { readStandardSiteRecord } from "../scripts/sync-standard-site-records";
import { standardSite } from "../src/lib/standardSite";

describe("Standard.site remote record reads", () => {
  it("uses the client's built-in getRecord query", async () => {
    const publisherDid = "did:plc:brimpw7k46xczmr4pqst45df";
    const rkey = "3mabcde123k2";
    const uri = `at://${publisherDid}/site.standard.publication/${rkey}`;
    const cid = "bafyreiapvnarfn3nl2wvg27hsylli5zqvou7a74p7od5mu4detprtejapy";
    const client = new Client(async (path, init) => {
      expect(path).toBe(
        `/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(publisherDid)}&collection=site.standard.publication&rkey=${rkey}`,
      );
      expect(init.method).toBe("GET");

      return Response.json({ uri, cid, value: standardSite.record });
    });

    await expect(
      readStandardSiteRecord(client, {
        repo: publisherDid,
        collection: "site.standard.publication",
        rkey,
      }),
    ).resolves.toEqual({ uri, cid, value: standardSite.record });
  });
});
