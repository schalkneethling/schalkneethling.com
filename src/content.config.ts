import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const postsCollection = defineCollection({
  loader: glob({
    pattern: ["**/*.md", "**/*.mdx"],
    base: "./src/content/posts",
  }),
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

const projectsCollection = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/projects",
  }),
  schema: z.object({
    category: z.enum(["main", "demo"]),
    description: z.string(),
    imageUrl: z.string().optional(),
    language: z.string().optional(),
    liveUrl: z.string().url().optional(),
    order: z.number().int().positive(),
    repoUrl: z.string().url(),
    stars: z.number().int().nonnegative().optional(),
    technologies: z.array(z.string()).optional(),
    title: z.string(),
  }),
});

export const collections = {
  posts: postsCollection,
  projects: projectsCollection,
};
