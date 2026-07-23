import { AtUri } from "@atproto/syntax";

import { site } from "../lexicons/index.ts";

type StandardSiteCollection =
  | "site.standard.document"
  | "site.standard.publication";

export type StandardSiteRecordReference = {
  readonly source: string;
  readonly atUri: string;
  readonly collection: StandardSiteCollection;
};

export type StandardSiteRemoteRecord = {
  readonly uri: string;
  readonly cid?: string;
  readonly value: unknown;
};

export type GetStandardSiteRecord = (reference: {
  readonly repo: string;
  readonly collection: StandardSiteCollection;
  readonly rkey: string;
}) => Promise<StandardSiteRemoteRecord | undefined>;

function assertStandardSiteRecord(
  collection: StandardSiteCollection,
  value: unknown,
) {
  if (collection === "site.standard.publication") {
    site.standard.publication.$parse(value);
  } else {
    site.standard.document.$parse(value);
  }
}

export async function inspectStandardSiteRecord(
  reference: StandardSiteRecordReference,
  publisherDid: string,
  getRecord: GetStandardSiteRecord,
) {
  const atUri = new AtUri(reference.atUri);

  if (atUri.hostname !== publisherDid) {
    throw new Error(
      `${reference.source} AT-URI is owned by ${atUri.hostname}, expected ${publisherDid}`,
    );
  }

  if (atUri.collection !== reference.collection || !atUri.rkey) {
    throw new Error(
      `${reference.source} AT-URI must identify a ${reference.collection} record`,
    );
  }

  const remote = await getRecord({
    repo: publisherDid,
    collection: reference.collection,
    rkey: atUri.rkey,
  });

  if (!remote) {
    return { ...reference, status: "missing" as const };
  }

  if (remote.uri !== reference.atUri || !remote.cid) {
    throw new Error(
      `${reference.source} remote record did not return the expected AT-URI and CID`,
    );
  }

  assertStandardSiteRecord(reference.collection, remote.value);
  return { ...reference, status: "found" as const, cid: remote.cid };
}
