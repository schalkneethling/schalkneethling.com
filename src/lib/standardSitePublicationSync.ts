import {
  mkdir,
  mkdtempDisposable,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

import { AtUri } from "@atproto/syntax";

import { site } from "../lexicons/index.ts";
import type { StandardSitePublicationConfig } from "./standardSite.ts";
import {
  clearStandardSiteCreate,
  readStandardSiteRecoveryJournal,
  reserveStandardSiteCreate,
  standardSiteRecoveryJournalPath,
  type PendingStandardSiteCreate,
} from "./standardSiteRecovery.ts";

const publicationSourcePath = "src/lib/standardSite.ts";

type PublicationRemoteRecord = {
  readonly uri: string;
  readonly cid?: string;
  readonly value: unknown;
};

type PublicationWriteServices = {
  readonly getRecord: (
    rkey: string,
  ) => Promise<PublicationRemoteRecord | undefined>;
  readonly createRecord: (
    record: StandardSitePublicationConfig["record"],
    rkey: string,
  ) => Promise<{ readonly uri: string; readonly cid?: string }>;
};

type PublicationSyncOptions = {
  readonly journalPath?: string;
  readonly configPath?: string;
};

function expectedPublicationAtUri(publisherDid: string, rkey: string) {
  return `at://${publisherDid}/site.standard.publication/${rkey}`;
}

async function persistPublicationAtUri(atUri: string, configPath: string) {
  const source = await readFile(configPath, "utf8");
  const unsetIdentifier = "publicationAtUri: undefined,";
  const persistedIdentifier = `publicationAtUri: ${JSON.stringify(atUri)},`;

  if (source.includes(persistedIdentifier)) {
    return;
  }

  if (source.split(unsetIdentifier).length !== 2) {
    throw new Error(
      `Cannot safely persist the publication AT-URI in ${configPath}`,
    );
  }

  const updatedSource = source.replace(unsetIdentifier, persistedIdentifier);
  const configDirectory = dirname(configPath);

  await mkdir(configDirectory, { recursive: true });
  await using temporaryDirectory = await mkdtempDisposable(
    join(configDirectory, ".standard-site-publication-"),
  );
  const temporaryPath = join(temporaryDirectory.path, "standardSite.ts");

  await writeFile(temporaryPath, updatedSource);
  await rename(temporaryPath, configPath);
}

function getPendingPublication(
  pendingCreates: readonly PendingStandardSiteCreate[],
) {
  const unsupportedReservation = pendingCreates.find(
    (pending) => pending.collection !== "site.standard.publication",
  );

  if (unsupportedReservation) {
    throw new Error(
      `Pending ${unsupportedReservation.collection} recovery must be reconciled before publication writes`,
    );
  }

  const publications = pendingCreates.filter(
    (pending) => pending.collection === "site.standard.publication",
  );

  if (publications.length > 1) {
    throw new Error(
      "Multiple pending publication creates require investigation",
    );
  }

  return publications[0];
}

async function completeReservation(
  reservation: PendingStandardSiteCreate,
  atUri: string,
  journalPath: string,
  configPath: string,
) {
  await persistPublicationAtUri(atUri, configPath);
  await clearStandardSiteCreate(reservation, journalPath);
}

export async function syncStandardSitePublication(
  config: StandardSitePublicationConfig,
  publisherDid: string,
  services: PublicationWriteServices,
  options: PublicationSyncOptions = {},
) {
  const journalPath = options.journalPath ?? standardSiteRecoveryJournalPath;
  const configPath = options.configPath ?? publicationSourcePath;
  const journal = await readStandardSiteRecoveryJournal(journalPath);
  const pendingPublication = getPendingPublication(journal.pendingCreates);

  if (config.identity.publicationAtUri) {
    if (pendingPublication) {
      throw new Error(
        "A pending publication create conflicts with the configured AT-URI",
      );
    }
    return {
      action: "skip" as const,
      reason: "publication already configured",
    };
  }

  const reservation =
    pendingPublication ??
    (await reserveStandardSiteCreate(
      {
        sourcePath: publicationSourcePath,
        canonicalUrl: config.record.url,
        collection: "site.standard.publication",
      },
      journalPath,
    ));

  if (
    reservation.sourcePath !== publicationSourcePath ||
    reservation.canonicalUrl !== config.record.url
  ) {
    throw new Error(
      "Pending publication reservation does not match publication configuration",
    );
  }

  const expectedAtUri = expectedPublicationAtUri(
    publisherDid,
    reservation.rkey,
  );
  const remote = await services.getRecord(reservation.rkey);

  if (remote) {
    const record = site.standard.publication.$parse(remote.value);

    if (
      remote.uri !== expectedAtUri ||
      !remote.cid ||
      record.url !== reservation.canonicalUrl
    ) {
      throw new Error(
        "Pending publication record does not match its reservation",
      );
    }

    await completeReservation(reservation, remote.uri, journalPath, configPath);
    return { action: "reconcile" as const, uri: remote.uri, cid: remote.cid };
  }

  const created = await services.createRecord(config.record, reservation.rkey);
  const createdUri = new AtUri(created.uri);

  if (
    created.uri !== expectedAtUri ||
    createdUri.hostname !== publisherDid ||
    !created.cid
  ) {
    throw new Error(
      "Created publication did not return the expected AT-URI and CID",
    );
  }

  await completeReservation(reservation, created.uri, journalPath, configPath);
  return { action: "create" as const, uri: created.uri, cid: created.cid };
}
