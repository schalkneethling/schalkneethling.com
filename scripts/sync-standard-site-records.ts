import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PasswordSession } from "@atproto/lex-password-session";

import { standardSite } from "../src/lib/standardSite.ts";
import { assertStandardSitePublisherDid } from "../src/lib/standardSiteAuth.ts";

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

  console.error(
    `DRY RUN: authenticated Standard.site publisher ${session.did}; no records were read or written`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
