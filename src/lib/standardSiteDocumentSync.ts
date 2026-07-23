import {
  mkdir,
  mkdtempDisposable,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

import { parseDocument } from "yaml";

import { site } from "../lexicons/index.ts";
import type { StandardSiteDocumentPayload } from "./standardSitePayloads.ts";
import {
  clearStandardSiteCreate,
  readStandardSiteRecoveryJournal,
  reserveStandardSiteCreate,
  standardSiteRecoveryJournalPath,
  type PendingStandardSiteCreate,
} from "./standardSiteRecovery.ts";

export type StandardSiteDocumentCreate = {
  readonly sourcePath: string;
  readonly canonicalUrl: string;
  readonly payload: StandardSiteDocumentPayload;
};

type DocumentRemoteRecord = {
  readonly uri: string;
  readonly cid?: string;
  readonly value: unknown;
};

type DocumentWriteServices = {
  readonly getRecord: (
    rkey: string,
  ) => Promise<DocumentRemoteRecord | undefined>;
  readonly createRecord: (
    record: StandardSiteDocumentPayload,
    rkey: string,
  ) => Promise<{ readonly uri: string; readonly cid?: string }>;
};

export type StandardSiteDocumentSyncResult = {
  readonly action: "create" | "reconcile";
  readonly sourcePath: string;
  readonly uri: string;
  readonly cid: string | undefined;
};

function expectedDocumentAtUri(publisherDid: string, rkey: string) {
  return `at://${publisherDid}/site.standard.document/${rkey}`;
}

async function persistDocumentAtUri(atUri: string, sourcePath: string) {
  const source = await readFile(sourcePath, "utf8");
  const frontmatter = source.match(
    /^(?<opening>---[ \t]*\r?\n)(?<yaml>[\s\S]*?)(?<closing>\r?\n---[ \t]*(?:\r?\n|$))/,
  );

  if (!frontmatter?.groups) {
    throw new Error(
      `Cannot safely persist the document AT-URI in ${sourcePath}`,
    );
  }

  const document = parseDocument(frontmatter.groups.yaml, {
    keepSourceTokens: true,
  });
  const hasValidFrontmatter =
    document.errors.length === 0 &&
    document.getIn(["standardSite", "publish"]) === true;
  const existingAtUri = document.getIn(["standardSite", "documentAtUri"]);

  if (
    !hasValidFrontmatter ||
    (existingAtUri !== undefined && existingAtUri !== atUri)
  ) {
    throw new Error(
      `Cannot safely persist the document AT-URI in ${sourcePath}`,
    );
  }

  if (existingAtUri === atUri) {
    return;
  }

  document.setIn(["standardSite", "documentAtUri"], atUri);
  const lineEnding = frontmatter.groups.opening.includes("\r\n")
    ? "\r\n"
    : "\n";
  const serializedFrontmatter = document
    .toString({ lineWidth: 0 })
    .trimEnd()
    .replaceAll("\n", lineEnding);
  const updatedFrontmatter = `${frontmatter.groups.opening}${serializedFrontmatter}${frontmatter.groups.closing}`;
  const updatedSource = source.replace(frontmatter[0], updatedFrontmatter);
  const sourceDirectory = dirname(sourcePath);

  await mkdir(sourceDirectory, { recursive: true });
  await using temporaryDirectory = await mkdtempDisposable(
    join(sourceDirectory, ".standard-site-document-"),
  );
  const temporaryPath = join(temporaryDirectory.path, "post");

  await writeFile(temporaryPath, updatedSource);
  await rename(temporaryPath, sourcePath);
}

function orderCreatesForRecovery(
  creates: readonly StandardSiteDocumentCreate[],
  pendingCreates: readonly PendingStandardSiteCreate[],
) {
  const pendingPublication = pendingCreates.find(
    (pending) => pending.collection === "site.standard.publication",
  );

  if (pendingPublication) {
    throw new Error(
      `Pending publication recovery ${pendingPublication.rkey} must be reconciled before document writes`,
    );
  }

  const createsBySourcePath = new Map(
    creates.map((create) => [create.sourcePath, create]),
  );
  const pendingDocuments = pendingCreates.map((pending) => {
    const create = createsBySourcePath.get(pending.sourcePath);

    if (!create || create.canonicalUrl !== pending.canonicalUrl) {
      throw new Error(
        `Pending document recovery ${pending.rkey} does not match the current document plan`,
      );
    }

    return create;
  });
  const pendingSourcePaths = new Set(
    pendingDocuments.map((create) => create.sourcePath),
  );

  return [
    ...pendingDocuments,
    ...creates.filter((create) => !pendingSourcePaths.has(create.sourcePath)),
  ];
}

async function completeReservation(
  reservation: PendingStandardSiteCreate,
  atUri: string,
  journalPath: string,
) {
  await persistDocumentAtUri(atUri, reservation.sourcePath);
  await clearStandardSiteCreate(reservation, journalPath);
}

function attachCompletedResults(
  error: unknown,
  results: readonly StandardSiteDocumentSyncResult[],
) {
  if (error instanceof Error && Object.isExtensible(error)) {
    Object.defineProperty(error, "completedResults", {
      enumerable: true,
      value: [...results],
    });
  }

  throw error;
}

export async function syncStandardSiteDocuments(
  creates: readonly StandardSiteDocumentCreate[],
  publisherDid: string,
  services: DocumentWriteServices,
  journalPath = standardSiteRecoveryJournalPath,
) {
  const journal = await readStandardSiteRecoveryJournal(journalPath);
  const orderedCreates = orderCreatesForRecovery(
    creates,
    journal.pendingCreates,
  );
  const results: StandardSiteDocumentSyncResult[] = [];

  for (const create of orderedCreates) {
    try {
      const reservation = await reserveStandardSiteCreate(
        {
          sourcePath: create.sourcePath,
          canonicalUrl: create.canonicalUrl,
          collection: "site.standard.document",
        },
        journalPath,
      );
      const expectedAtUri = expectedDocumentAtUri(
        publisherDid,
        reservation.rkey,
      );
      const remote = await services.getRecord(reservation.rkey);

      if (remote) {
        const record = site.standard.document.$parse(remote.value);
        const hasRemotePath = typeof record.path === "string";
        const remoteCanonicalUrl =
          typeof record.path === "string"
            ? new URL(record.path, create.canonicalUrl).href
            : undefined;
        const hasExpectedUri = remote.uri === expectedAtUri;
        const hasCid = Boolean(remote.cid);
        const hasExpectedSite = record.site === create.payload.site;
        const hasExpectedCanonicalUrl =
          remoteCanonicalUrl === reservation.canonicalUrl;

        if (
          !hasExpectedUri ||
          !hasCid ||
          !hasExpectedSite ||
          !hasRemotePath ||
          !hasExpectedCanonicalUrl
        ) {
          throw new Error(
            `Pending document record ${reservation.rkey} does not match its reservation`,
          );
        }

        await completeReservation(reservation, remote.uri, journalPath);
        results.push({
          action: "reconcile",
          sourcePath: create.sourcePath,
          uri: remote.uri,
          cid: remote.cid,
        });
        continue;
      }

      const created = await services.createRecord(
        create.payload,
        reservation.rkey,
      );
      const hasExpectedUri = created.uri === expectedAtUri;
      const hasCid = Boolean(created.cid);

      if (!hasExpectedUri || !hasCid) {
        throw new Error(
          `Created document ${reservation.rkey} returned URI ${created.uri} and CID ${created.cid ?? "missing"}; expected URI ${expectedAtUri} and a CID`,
        );
      }

      await completeReservation(reservation, created.uri, journalPath);
      results.push({
        action: "create",
        sourcePath: create.sourcePath,
        uri: created.uri,
        cid: created.cid,
      });
    } catch (error) {
      attachCompletedResults(error, results);
    }
  }

  return results;
}
