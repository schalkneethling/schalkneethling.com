import {
  mkdir,
  mkdtempDisposable,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

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

function expectedDocumentAtUri(publisherDid: string, rkey: string) {
  return `at://${publisherDid}/site.standard.document/${rkey}`;
}

async function persistDocumentAtUri(atUri: string, sourcePath: string) {
  const source = await readFile(sourcePath, "utf8");
  const persistedIdentifier = `  documentAtUri: ${JSON.stringify(atUri)}`;

  if (source.includes(persistedIdentifier)) {
    return;
  }

  const publishIdentifier = "standardSite:\n  publish: true";

  if (source.split(publishIdentifier).length !== 2) {
    throw new Error(
      `Cannot safely persist the document AT-URI in ${sourcePath}`,
    );
  }

  const updatedSource = source.replace(
    publishIdentifier,
    `${publishIdentifier}\n${persistedIdentifier}`,
  );
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
  const results = [];

  for (const create of orderedCreates) {
    const reservation = await reserveStandardSiteCreate(
      {
        sourcePath: create.sourcePath,
        canonicalUrl: create.canonicalUrl,
        collection: "site.standard.document",
      },
      journalPath,
    );
    const expectedAtUri = expectedDocumentAtUri(publisherDid, reservation.rkey);
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
        action: "reconcile" as const,
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
      action: "create" as const,
      sourcePath: create.sourcePath,
      uri: created.uri,
      cid: created.cid,
    });
  }

  return results;
}
