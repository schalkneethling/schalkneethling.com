import { isAtUriString } from "@atproto/lex";
import { z } from "astro/zod";

const isStandardSiteDocumentAtUri = (value: string) => {
  if (!isAtUriString(value)) {
    return false;
  }

  const [, , authority, collection, recordKey, ...extra] = value.split("/");

  return Boolean(
    authority &&
      collection === "site.standard.document" &&
      recordKey &&
      extra.length === 0,
  );
};

const standardSiteDocumentAtUri = z
  .string()
  .refine(
    isStandardSiteDocumentAtUri,
    "Expected a site.standard.document AT-URI",
  );

export const postStandardSiteSchema = z.object({
  publish: z.boolean(),
  documentAtUri: standardSiteDocumentAtUri.optional(),
});
