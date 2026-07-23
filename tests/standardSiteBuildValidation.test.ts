import { mkdir, mkdtempDisposable, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validateStandardSiteBuild } from "../src/lib/standardSiteBuildValidation";

const publicationAtUri =
  "at://did:plc:example/site.standard.publication/3mpublication";
const documentAtUri = "at://did:plc:example/site.standard.document/3mdocument";

async function createTestBuild() {
  const temporaryDirectory = await mkdtempDisposable(
    join(import.meta.dirname, ".standard-site-build-"),
  );
  const distDirectory = join(temporaryDirectory.path, "dist");
  const postsDirectory = join(temporaryDirectory.path, "posts");
  const postDirectory = join(distDirectory, "posts", "example");

  await mkdir(join(distDirectory, ".well-known"), { recursive: true });
  await mkdir(postDirectory, { recursive: true });
  await mkdir(postsDirectory, { recursive: true });
  await writeFile(
    join(distDirectory, ".well-known", "site.standard.publication"),
    publicationAtUri,
  );
  await writeFile(
    join(postDirectory, "index.html"),
    `<link rel="site.standard.publication" href="${publicationAtUri}"><link href="${documentAtUri}" rel="site.standard.document">`,
  );
  await writeFile(
    join(postsDirectory, "example.md"),
    `---\nstandardSite:\n  publish: true\n  documentAtUri: ${documentAtUri}\n---\n`,
  );

  return {
    distDirectory,
    postsDirectory,
    [Symbol.asyncDispose]: () => temporaryDirectory[Symbol.asyncDispose](),
  };
}

describe("Standard.site build validation", () => {
  it("validates publication discovery and configured document links", async () => {
    await using testBuild = await createTestBuild();

    await expect(
      validateStandardSiteBuild({
        ...testBuild,
        publicationAtUri,
      }),
    ).resolves.toEqual({ htmlFileCount: 1, documentCount: 1 });
  });

  it("reports a configured document missing from the built site", async () => {
    await using testBuild = await createTestBuild();
    await writeFile(
      join(testBuild.distDirectory, "posts", "example", "index.html"),
      `<link rel="site.standard.publication" href="${publicationAtUri}">`,
    );

    await expect(
      validateStandardSiteBuild({
        ...testBuild,
        publicationAtUri,
      }),
    ).rejects.toThrow("emits it 0 times");
  });

  it("rejects a document AT-URI configured by multiple posts", async () => {
    await using testBuild = await createTestBuild();
    await writeFile(
      join(testBuild.postsDirectory, "duplicate.md"),
      `---\nstandardSite:\n  publish: true\n  documentAtUri: ${documentAtUri}\n---\n`,
    );

    await expect(
      validateStandardSiteBuild({
        ...testBuild,
        publicationAtUri,
      }),
    ).rejects.toThrow("is configured by multiple posts");
  });

  it("rejects a document link emitted by the wrong post page", async () => {
    await using testBuild = await createTestBuild();
    const otherPostDirectory = join(testBuild.distDirectory, "posts", "other");
    await mkdir(otherPostDirectory, { recursive: true });
    await writeFile(
      join(testBuild.distDirectory, "posts", "example", "index.html"),
      `<link rel="site.standard.publication" href="${publicationAtUri}">`,
    );
    await writeFile(
      join(otherPostDirectory, "index.html"),
      `<link rel="site.standard.publication" href="${publicationAtUri}"><link rel="site.standard.document" href="${documentAtUri}">`,
    );

    await expect(
      validateStandardSiteBuild({
        ...testBuild,
        publicationAtUri,
      }),
    ).rejects.toThrow("but its configured page is");
  });

  it("reports a rendered page missing publication discovery", async () => {
    await using testBuild = await createTestBuild();
    await writeFile(
      join(testBuild.distDirectory, "posts", "example", "index.html"),
      `<link href="${documentAtUri}" rel="site.standard.document">`,
    );

    await expect(
      validateStandardSiteBuild({
        ...testBuild,
        publicationAtUri,
      }),
    ).rejects.toThrow("is missing the publication discovery link");
  });

  it("reports an incorrect publication verification value", async () => {
    await using testBuild = await createTestBuild();
    await writeFile(
      join(testBuild.distDirectory, ".well-known", "site.standard.publication"),
      "at://did:plc:other/site.standard.publication/3mother",
    );

    await expect(
      validateStandardSiteBuild({
        ...testBuild,
        publicationAtUri,
      }),
    ).rejects.toThrow("does not contain the configured publication AT-URI");
  });

  it("does not require publication discovery on redirect documents", async () => {
    await using testBuild = await createTestBuild();
    await writeFile(
      join(testBuild.distDirectory, "redirect.html"),
      '<meta http-equiv="refresh" content="0;url=/posts/example/">',
    );

    await expect(
      validateStandardSiteBuild({
        ...testBuild,
        publicationAtUri,
      }),
    ).resolves.toEqual({ htmlFileCount: 2, documentCount: 1 });
  });
});
