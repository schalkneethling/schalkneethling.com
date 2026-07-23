import { mkdtempDisposable, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  syncStandardSiteDocuments,
  type StandardSiteDocumentSyncResult,
} from "../src/lib/standardSiteDocumentSync";
import {
  readStandardSiteRecoveryJournal,
  reserveStandardSiteCreate,
} from "../src/lib/standardSiteRecovery";

const publisherDid = "did:plc:brimpw7k46xczmr4pqst45df";
const publicationAtUri = `at://${publisherDid}/site.standard.publication/3mrd3atn7qc2y`;

async function createTestDocument(name = "example") {
  const temporaryDirectory = await mkdtempDisposable(
    join(tmpdir(), "standard-site-document-"),
  );
  const sourcePath = join(temporaryDirectory.path, `${name}.md`);
  const journalPath = join(temporaryDirectory.path, "recovery.json");
  const canonicalUrl = `https://schalkneethling.com/posts/${name}/`;
  const payload = {
    $type: "site.standard.document" as const,
    site: publicationAtUri,
    path: `/posts/${name}/`,
    title: "Example post",
    description: "An example post.",
    publishedAt: "2026-07-23T00:00:00.000Z",
    tags: ["atproto"],
  };

  await writeFile(
    sourcePath,
    "---\ntitle: Example\nstandardSite:\n  publish: true\n---\n",
  );

  return {
    create: { sourcePath, canonicalUrl, payload },
    journalPath,
    sourcePath,
    async [Symbol.asyncDispose]() {
      await temporaryDirectory.remove();
    },
  };
}

function documentUri(rkey: string) {
  return `at://${publisherDid}/site.standard.document/${rkey}`;
}

describe("Standard.site document sync", () => {
  it("reserves, creates, persists, and clears in order", async () => {
    await using document = await createTestDocument();
    const createRecord = vi.fn(async (_record, rkey: string) => {
      expect(
        (await readStandardSiteRecoveryJournal(document.journalPath))
          .pendingCreates[0]?.rkey,
      ).toBe(rkey);
      return { uri: documentUri(rkey), cid: "bafyreiexample" };
    });

    const [result] = await syncStandardSiteDocuments(
      [document.create],
      publisherDid,
      { getRecord: async () => undefined, createRecord },
      document.journalPath,
    );

    expect(result).toMatchObject({
      action: "create",
      sourcePath: document.sourcePath,
      cid: "bafyreiexample",
    });
    expect(await readFile(document.sourcePath, "utf8")).toContain(
      `documentAtUri: ${result?.uri}`,
    );
    await expect(stat(document.journalPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("persists into equivalent YAML frontmatter without changing line endings", async () => {
    await using document = await createTestDocument();
    await writeFile(
      document.sourcePath,
      "---\r\nstandardSite: { publish: true }\r\ntitle: Example\r\n---\r\nBody\r\n",
    );

    const [result] = await syncStandardSiteDocuments(
      [document.create],
      publisherDid,
      {
        getRecord: async () => undefined,
        createRecord: async (_record, rkey) => ({
          uri: documentUri(rkey),
          cid: "bafyreiexample",
        }),
      },
      document.journalPath,
    );
    const persistedSource = await readFile(document.sourcePath, "utf8");

    expect(persistedSource).toContain(`documentAtUri: ${result?.uri}`);
    expect(persistedSource).toContain("---\r\n");
    expect(persistedSource).toContain("\r\nBody\r\n");
    expect(persistedSource).not.toMatch(/(?<!\r)\n/);
  });

  it("reconciles a pending remote record before a new create", async () => {
    await using pendingDocument = await createTestDocument("pending");
    await using newDocument = await createTestDocument("new");
    const reservation = await reserveStandardSiteCreate(
      {
        sourcePath: pendingDocument.sourcePath,
        canonicalUrl: pendingDocument.create.canonicalUrl,
        collection: "site.standard.document",
      },
      pendingDocument.journalPath,
    );
    const operations: string[] = [];

    const results = await syncStandardSiteDocuments(
      [newDocument.create, pendingDocument.create],
      publisherDid,
      {
        getRecord: async (rkey) => {
          operations.push(`get:${rkey}`);
          return rkey === reservation.rkey
            ? {
                uri: documentUri(rkey),
                cid: "bafyreipending",
                value: pendingDocument.create.payload,
              }
            : undefined;
        },
        createRecord: async (_record, rkey) => {
          operations.push(`create:${rkey}`);
          return { uri: documentUri(rkey), cid: "bafyreinew" };
        },
      },
      pendingDocument.journalPath,
    );

    expect(results.map((result) => result.action)).toEqual([
      "reconcile",
      "create",
    ]);
    expect(operations[0]).toBe(`get:${reservation.rkey}`);
  });

  it.each([
    ["source path", "src/content/posts/other.md", undefined],
    ["canonical URL", undefined, "https://schalkneethling.com/posts/other/"],
  ])(
    "blocks the batch when pending recovery has a mismatched %s",
    async (_description, sourcePath, canonicalUrl) => {
      await using document = await createTestDocument();
      await reserveStandardSiteCreate(
        {
          sourcePath: sourcePath ?? document.sourcePath,
          canonicalUrl: canonicalUrl ?? document.create.canonicalUrl,
          collection: "site.standard.document",
        },
        document.journalPath,
      );
      const getRecord = vi.fn();
      const createRecord = vi.fn();

      await expect(
        syncStandardSiteDocuments(
          [document.create],
          publisherDid,
          { getRecord, createRecord },
          document.journalPath,
        ),
      ).rejects.toThrow("does not match the current document plan");
      expect(getRecord).not.toHaveBeenCalled();
      expect(createRecord).not.toHaveBeenCalled();
    },
  );

  it("attaches completed results when a later create fails", async () => {
    await using firstDocument = await createTestDocument("first");
    await using secondDocument = await createTestDocument("second");
    const failure = new Error("PDS unavailable");
    const createRecord = vi
      .fn()
      .mockImplementationOnce(async (_record, rkey) => ({
        uri: documentUri(rkey),
        cid: "bafyreifirst",
      }))
      .mockRejectedValueOnce(failure);

    try {
      await syncStandardSiteDocuments(
        [firstDocument.create, secondDocument.create],
        publisherDid,
        { getRecord: async () => undefined, createRecord },
        firstDocument.journalPath,
      );
      expect.unreachable("Expected document sync to fail");
    } catch (error) {
      expect(error).toBe(failure);
      expect(
        (
          error as Error & {
            completedResults: StandardSiteDocumentSyncResult[];
          }
        ).completedResults,
      ).toMatchObject([
        {
          action: "create",
          sourcePath: firstDocument.sourcePath,
          cid: "bafyreifirst",
        },
      ]);
    }
  });

  it("leaves the reservation when local persistence fails", async () => {
    await using document = await createTestDocument();
    await writeFile(document.sourcePath, "---\ntitle: Example\n---\n");

    await expect(
      syncStandardSiteDocuments(
        [document.create],
        publisherDid,
        {
          getRecord: async () => undefined,
          createRecord: async (_record, rkey) => ({
            uri: documentUri(rkey),
            cid: "bafyreiexample",
          }),
        },
        document.journalPath,
      ),
    ).rejects.toThrow("Cannot safely persist");

    expect(
      (await readStandardSiteRecoveryJournal(document.journalPath))
        .pendingCreates,
    ).toHaveLength(1);
  });

  it("fails closed when publication recovery is pending", async () => {
    await using document = await createTestDocument();
    await reserveStandardSiteCreate(
      {
        sourcePath: "src/lib/standardSite.ts",
        canonicalUrl: "https://schalkneethling.com",
        collection: "site.standard.publication",
      },
      document.journalPath,
    );
    const createRecord = vi.fn();

    await expect(
      syncStandardSiteDocuments(
        [document.create],
        publisherDid,
        { getRecord: vi.fn(), createRecord },
        document.journalPath,
      ),
    ).rejects.toThrow("Pending publication recovery");
    expect(createRecord).not.toHaveBeenCalled();
  });
});
