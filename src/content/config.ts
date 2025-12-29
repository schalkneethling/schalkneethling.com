import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    tags: z.array(z.string()),
    canonical: z.string().optional(),
    layout: z.string().optional(),
  }),
});

export const collections = {
  posts: postsCollection,
};

