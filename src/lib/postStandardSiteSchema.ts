import { z } from "astro/zod";

const standardSiteDocumentAtUri = z.string().regex(
  /^at:\/\/[^/\s]+\/site\.standard\.document\/[^/\s]+$/,
  "Expected a site.standard.document AT-URI",
);

export const postStandardSiteSchema = z.object({
  publish: z.boolean(),
  documentAtUri: standardSiteDocumentAtUri.optional(),
});
