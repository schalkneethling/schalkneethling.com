import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { Client, XrpcResponseError } from "@atproto/lex-client";
import { PasswordSession } from "@atproto/lex-password-session";

import { prepareStandardSitePlan } from "./generate-standard-site-records.ts";
import { getRecord } from "../src/lexicons/com/atproto/repo.ts";
import { standardSite } from "../src/lib/standardSite.ts";
import { assertStandardSitePublisherDid } from "../src/lib/standardSiteAuth.ts";
import {
  inspectStandardSiteRecord,
  type StandardSiteRecordReference,
} from "../src/lib/standardSiteInspection.ts";

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

async function main() {
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
  const inspections = [];

  for (const reference of references) {
    const inspection = await inspectStandardSiteRecord(
      reference,
      session.did,
      async (params) => {
        try {
          return await client.call(
            getRecord.main,
            getRecord.$params.parse(params),
          );
        } catch (error) {
          if (
            error instanceof XrpcResponseError &&
            error.error === "RecordNotFound"
          ) {
            return undefined;
          }
          throw error;
        }
      },
    );
    inspections.push(inspection);
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
