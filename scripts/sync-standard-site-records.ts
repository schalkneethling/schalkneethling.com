import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  Client,
  XrpcResponseError,
  type DidString,
  type Infer,
  type InferRecordKey,
  type Main,
  type RecordSchema,
} from "@atproto/lex";
import { PasswordSession } from "@atproto/lex-password-session";
import { assertAtIdentifierString } from "@atproto/syntax";

import { prepareStandardSitePlan } from "./generate-standard-site-records.ts";
import { site } from "../src/lexicons/index.ts";
import { standardSite } from "../src/lib/standardSite.ts";
import { assertStandardSitePublisherDid } from "../src/lib/standardSiteAuth.ts";
import {
  syncStandardSiteDocuments,
  type StandardSiteDocumentCreate,
  type StandardSiteDocumentSyncResult,
} from "../src/lib/standardSiteDocumentSync.ts";
import {
  inspectStandardSiteRecord,
  type StandardSiteRecordReference,
} from "../src/lib/standardSiteInspection.ts";
import { syncStandardSitePublication } from "../src/lib/standardSitePublicationSync.ts";
import { readStandardSiteRecoveryJournal } from "../src/lib/standardSiteRecovery.ts";

function requiredEnvironmentVariable(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function authenticateStandardSitePublisher() {
  const service = requiredEnvironmentVariable(
    process.env.ATPROTO_SERVICE_URL,
    "ATPROTO_SERVICE_URL",
  );
  const identifier = requiredEnvironmentVariable(
    process.env.ATPROTO_HANDLE,
    "ATPROTO_HANDLE",
  );
  const password = requiredEnvironmentVariable(
    process.env.ATPROTO_APP_PASSWORD,
    "ATPROTO_APP_PASSWORD",
  );
  const session = await PasswordSession.login({
    service,
    identifier,
    password,
  });

  assertStandardSitePublisherDid(session.did, standardSite.identity.did);
  return session;
}

function isWriteMode() {
  const argumentsAfterScript = process.argv.slice(2);

  if (
    argumentsAfterScript.length === 0 ||
    (argumentsAfterScript.length === 1 && argumentsAfterScript[0] === "--write")
  ) {
    return argumentsAfterScript[0] === "--write";
  }

  throw new Error(`Unsupported arguments: ${argumentsAfterScript.join(" ")}`);
}

function isRecordNotFoundError(error: unknown) {
  return error instanceof XrpcResponseError && error.error === "RecordNotFound";
}

export async function readStandardSiteRecord(
  client: Client,
  params: {
    repo: string;
    collection: "site.standard.document" | "site.standard.publication";
    rkey: string;
  },
) {
  try {
    assertAtIdentifierString(params.repo);
    const response = await client.getRecord(params.collection, params.rkey, {
      repo: params.repo,
    });
    return response.body;
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return undefined;
    }
    throw error;
  }
}

function getCompletedDocumentResults(error: unknown) {
  if (
    error instanceof Error &&
    "completedResults" in error &&
    Array.isArray(error.completedResults)
  ) {
    return error.completedResults as StandardSiteDocumentSyncResult[];
  }

  return [];
}

function writeStatus(message: string) {
  // Keep human-readable status on stderr so stdout remains valid JSON for
  // redirection or other machine-readable consumers.
  process.stderr.write(`${message}\n`);
}

function createRecord<T extends RecordSchema<"tid">>(
  client: Client,
  publisherDid: DidString,
  record: unknown,
  rkey: InferRecordKey<T>,
  definition: {
    readonly main: Main<T>;
    readonly $parse: (value: unknown) => Infer<T>;
  },
) {
  const { $type: _type, ...input } = definition.$parse(record);

  return client.create(definition.main, input, {
    repo: publisherDid,
    rkey,
    validateRequest: true,
  });
}

async function main() {
  const write = isWriteMode();
  await using session = await authenticateStandardSitePublisher();
  const plan = await prepareStandardSitePlan();
  const references: StandardSiteRecordReference[] = [];

  if (plan.publication.publicationAtUri) {
    references.push({
      source: "publication configuration",
      atUri: plan.publication.publicationAtUri,
      collection: "site.standard.publication",
    });
  }

  for (const plannedDocument of plan.documents) {
    if (
      "documentAtUri" in plannedDocument &&
      typeof plannedDocument.documentAtUri === "string"
    ) {
      references.push({
        source: plannedDocument.id,
        atUri: plannedDocument.documentAtUri,
        collection: "site.standard.document",
      });
    }
  }

  const client = new Client(session);
  const readRecord = (params: Parameters<typeof readStandardSiteRecord>[1]) =>
    readStandardSiteRecord(client, params);
  const inspections = [];

  for (const reference of references) {
    const inspection = await inspectStandardSiteRecord(
      reference,
      session.did,
      readRecord,
    );
    inspections.push(inspection);
  }

  if (write) {
    const documents: StandardSiteDocumentSyncResult[] = [];

    try {
      const documentCreates: StandardSiteDocumentCreate[] = plan.documents
        .filter((document) => document.action === "create")
        .map((document) => {
          if (!("sourcePath" in document) || !document.sourcePath) {
            throw new Error(`Missing source path for document ${document.id}`);
          }

          return {
            sourcePath: document.sourcePath,
            canonicalUrl: new URL(
              document.payload.path,
              standardSite.record.url,
            ).href,
            payload: document.payload,
          };
        });
      const documentServices = {
        getRecord: (rkey: string) =>
          readRecord({
            repo: session.did,
            collection: "site.standard.document",
            rkey,
          }),
        createRecord: (
          record: StandardSiteDocumentCreate["payload"],
          rkey: string,
        ) =>
          createRecord(
            client,
            session.did,
            record,
            rkey,
            site.standard.document,
          ),
      };
      const journal = await readStandardSiteRecoveryJournal();
      const pendingDocumentSourcePaths = new Set(
        journal.pendingCreates
          .filter((pending) => pending.collection === "site.standard.document")
          .map((pending) => pending.sourcePath),
      );
      const pendingDocumentCreates = documentCreates.filter((create) =>
        pendingDocumentSourcePaths.has(create.sourcePath),
      );
      const newDocumentCreates = documentCreates.filter(
        (create) => !pendingDocumentSourcePaths.has(create.sourcePath),
      );

      if (pendingDocumentSourcePaths.size > 0) {
        documents.push(
          ...(await syncStandardSiteDocuments(
            pendingDocumentCreates,
            session.did,
            documentServices,
          )),
        );
      }

      const publication = await syncStandardSitePublication(
        standardSite,
        session.did,
        {
          getRecord: (rkey) =>
            readRecord({
              repo: session.did,
              collection: "site.standard.publication",
              rkey,
            }),
          createRecord: (record, rkey) =>
            createRecord(
              client,
              session.did,
              record,
              rkey,
              site.standard.publication,
            ),
        },
      );

      documents.push(
        ...(await syncStandardSiteDocuments(
          newDocumentCreates,
          session.did,
          documentServices,
        )),
      );

      writeStatus(
        `WRITE: publication ${publication.action}; documents ${documents.length}`,
      );
      console.log(
        JSON.stringify({ plan, inspections, publication, documents }, null, 2),
      );
    } catch (error) {
      const completedDocuments = [
        ...documents,
        ...getCompletedDocumentResults(error),
      ];

      console.error(
        `WRITE STOPPED: ${completedDocuments.length} document records completed; rerun after resolving the reported error`,
      );
      console.log(JSON.stringify({ completedDocuments }, null, 2));
      throw error;
    }
    return;
  }

  writeStatus(
    `DRY RUN: authenticated Standard.site publisher ${session.did}; inspected ${inspections.length} configured records; no records were written`,
  );
  console.log(JSON.stringify({ plan, inspections }, null, 2));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
