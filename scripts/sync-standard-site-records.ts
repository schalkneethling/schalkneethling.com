import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { Client, XrpcResponseError } from "@atproto/lex-client";
import { PasswordSession } from "@atproto/lex-password-session";

import { prepareStandardSitePlan } from "./generate-standard-site-records.ts";
import { getRecord } from "../src/lexicons/com/atproto/repo.ts";
import { site } from "../src/lexicons/index.ts";
import { standardSite } from "../src/lib/standardSite.ts";
import { assertStandardSitePublisherDid } from "../src/lib/standardSiteAuth.ts";
import {
  inspectStandardSiteRecord,
  type StandardSiteRecordReference,
} from "../src/lib/standardSiteInspection.ts";
import { syncStandardSitePublication } from "../src/lib/standardSitePublicationSync.ts";

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
  const readRecord = async (params: {
    repo: string;
    collection: "site.standard.document" | "site.standard.publication";
    rkey: string;
  }) => {
    try {
      return await client.call(getRecord.main, getRecord.$params.parse(params));
    } catch (error) {
      if (
        error instanceof XrpcResponseError &&
        error.error === "RecordNotFound"
      ) {
        return undefined;
      }
      throw error;
    }
  };
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
        createRecord: async (record, rkey) => {
          const { $type: _type, ...input } =
            site.standard.publication.$parse(record);
          return client.create(site.standard.publication.main, input, {
            repo: session.did,
            rkey,
            validate: true,
            validateRequest: true,
          });
        },
      },
    );

    console.error(
      `WRITE: publication ${publication.action}; document writes are not implemented`,
    );
    console.log(JSON.stringify({ plan, inspections, publication }, null, 2));
    return;
  }

  console.error(
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
