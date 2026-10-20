import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { postSchema } from "./lib/postSchema";

const postsCollection = defineCollection({
  loader: glob({
    pattern: ["**/*.md", "**/*.mdx"],
    base: "./src/content/posts",
  }),
  schema: postSchema,
});

const projectsCollection = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/projects",
  }),
  schema: z.object({
    category: z.enum(["main", "demo"]),
    description: z.string(),
    imageUrl: z.string().trim().min(1),
    language: z.string().optional(),
    liveUrl: z.string().url().optional(),
    order: z.number().int().positive(),
    repoUrl: z.string().url(),
    contributionGuidance: z.string().optional(),
    currentState: z.string().optional(),
    goalDocUrl: z.string().url().optional(),
    goalSummary: z.string().optional(),
    nextSteps: z.array(z.string()).optional(),
    roadmapDocUrl: z.string().url().optional(),
    stars: z.number().int().nonnegative().optional(),
    technologies: z.array(z.string()).optional(),
    title: z.string(),
    whatAndWhy: z.string().optional(),
  }),
});

export const collections = {
  posts: postsCollection,
  projects: projectsCollection,
};
