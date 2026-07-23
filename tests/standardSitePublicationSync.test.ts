import { mkdtempDisposable, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  standardSite,
  type StandardSitePublicationConfig,
} from "../src/lib/standardSite";
import { syncStandardSitePublication } from "../src/lib/standardSitePublicationSync";
import {
  readStandardSiteRecoveryJournal,
  reserveStandardSiteCreate,
} from "../src/lib/standardSiteRecovery";

const publisherDid = "did:plc:brimpw7k46xczmr4pqst45df";
const unpublishedStandardSite = {
  ...standardSite,
  identity: {
    ...standardSite.identity,
    publicationAtUri: undefined,
  },
} satisfies StandardSitePublicationConfig;

async function createTestPaths() {
  const temporaryDirectory = await mkdtempDisposable(
    join(tmpdir(), "standard-site-publication-"),
  );
  const configPath = join(temporaryDirectory.path, "standardSite.ts");
  const journalPath = join(temporaryDirectory.path, "recovery.json");

  await writeFile(
    configPath,
    "export const standardSite = { identity: { publicationAtUri: undefined, } };",
  );

  return {
    configPath,
    journalPath,
    async [Symbol.asyncDispose]() {
      await temporaryDirectory.remove();
    },
  };
}

describe("Standard.site publication sync", () => {
  it("reserves, creates, persists, and clears in order", async () => {
    await using paths = await createTestPaths();
    const createRecord = vi.fn(async (_record, rkey: string) => {
      expect(
        (await readStandardSiteRecoveryJournal(paths.journalPath))
          .pendingCreates[0]?.rkey,
      ).toBe(rkey);
      return {
        uri: `at://${publisherDid}/site.standard.publication/${rkey}`,
        cid: "bafyreiexample",
      };
    });

    const result = await syncStandardSitePublication(
      unpublishedStandardSite,
      publisherDid,
      {
        getRecord: async () => undefined,
        createRecord,
      },
      paths,
    );

    expect(result).toMatchObject({ action: "create", cid: "bafyreiexample" });
    expect(await readFile(paths.configPath, "utf8")).toContain(
      `publicationAtUri: "${result.uri}"`,
    );
    await expect(stat(paths.journalPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("reconciles a matching pending remote record without creating", async () => {
    await using paths = await createTestPaths();
    const reservation = await reserveStandardSiteCreate(
      {
        sourcePath: "src/lib/standardSite.ts",
        canonicalUrl: standardSite.record.url,
        collection: "site.standard.publication",
      },
      paths.journalPath,
    );
    const uri = `at://${publisherDid}/site.standard.publication/${reservation.rkey}`;
    const createRecord = vi.fn();

    const result = await syncStandardSitePublication(
      unpublishedStandardSite,
      publisherDid,
      {
        getRecord: async () => ({
          uri,
          cid: "bafyreiexample",
          value: standardSite.record,
        }),
        createRecord,
      },
      paths,
    );

    expect(result).toEqual({
      action: "reconcile",
      uri,
      cid: "bafyreiexample",
    });
    expect(createRecord).not.toHaveBeenCalled();
    expect(await readFile(paths.configPath, "utf8")).toContain(uri);
  });

  it("leaves the reservation when local persistence fails", async () => {
    await using paths = await createTestPaths();
    await writeFile(paths.configPath, "export const unrelated = true;");

    await expect(
      syncStandardSitePublication(
        unpublishedStandardSite,
        publisherDid,
        {
          getRecord: async () => undefined,
          createRecord: async (_record, rkey) => ({
            uri: `at://${publisherDid}/site.standard.publication/${rkey}`,
            cid: "bafyreiexample",
          }),
        },
        paths,
      ),
    ).rejects.toThrow("Cannot safely persist");

    expect(
      (await readStandardSiteRecoveryJournal(paths.journalPath)).pendingCreates,
    ).toHaveLength(1);
  });

  it("fails closed when pending publication identity has changed", async () => {
    await using paths = await createTestPaths();
    await reserveStandardSiteCreate(
      {
        sourcePath: "src/lib/standardSite.ts",
        canonicalUrl: "https://example.com",
        collection: "site.standard.publication",
      },
      paths.journalPath,
    );
    const createRecord = vi.fn();

    await expect(
      syncStandardSitePublication(
        unpublishedStandardSite,
        publisherDid,
        { getRecord: vi.fn(), createRecord },
        paths,
      ),
    ).rejects.toThrow("does not match publication configuration");
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("fails closed when document recovery is pending", async () => {
    await using paths = await createTestPaths();
    await reserveStandardSiteCreate(
      {
        sourcePath: "src/content/posts/example.md",
        canonicalUrl: "https://schalkneethling.com/posts/example/",
        collection: "site.standard.document",
      },
      paths.journalPath,
    );
    const createRecord = vi.fn();

    await expect(
      syncStandardSitePublication(
        unpublishedStandardSite,
        publisherDid,
        { getRecord: vi.fn(), createRecord },
        paths,
      ),
    ).rejects.toThrow("site.standard.document recovery");
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("fails closed when multiple publication creates are pending", async () => {
    await using paths = await createTestPaths();
    const sourcePaths = [
      "src/lib/standardSite.ts",
      "src/lib/standardSite-copy.ts",
    ];

    for (const sourcePath of sourcePaths) {
      await reserveStandardSiteCreate(
        {
          sourcePath,
          canonicalUrl: standardSite.record.url,
          collection: "site.standard.publication",
        },
        paths.journalPath,
      );
    }
    const createRecord = vi.fn();

    await expect(
      syncStandardSitePublication(
        unpublishedStandardSite,
        publisherDid,
        { getRecord: vi.fn(), createRecord },
        paths,
      ),
    ).rejects.toThrow("Found 2 pending publication creates");
    expect(createRecord).not.toHaveBeenCalled();
  });
});
