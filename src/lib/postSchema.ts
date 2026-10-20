import { z } from "astro/zod";

import { postStandardSiteSchema } from "./postStandardSiteSchema.ts";

/**
 * Frontmatter schema for the posts collection. Shared by the content
 * collection and the draft publishing command so a draft is validated
 * against exactly the rules the build will apply.
 */
export const postSchema = z.object({
  title: z.string(),
  pubDate: z.date(),
  description: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  canonical: z.string().optional(),
  layout: z.string().optional(),
  standardSite: postStandardSiteSchema.optional(),
});
