import fs from "fs/promises";
import path from "path";

import invariant from "tiny-invariant";
import parseFrontmatter from "front-matter";

import { getContents } from "./content-utils";

export type Post = {
  description: string;
  slug: string;
  title: string;
};

export type PostMarkdownAttributes = {
  draft?: boolean;
  tags?: string[];
  description: string;
  title: string;
};

const postsPath = path.join(__dirname, "../../../..", "posts");

export function isValidPostAttributes(
  attributes: any
): attributes is PostMarkdownAttributes {
  return attributes?.title && attributes?.description;
}

export async function getPost(slug: string) {
  const filepath = path.join(postsPath, `${slug}.md`);
  const { html, title } = await getContents(filepath);
  return { slug, html, title };
}

export async function getPosts() {
  const dir = await fs.readdir(postsPath);
  const posts = await Promise.all(
    dir.map(async (filename) => {
      const file = await fs.readFile(path.join(postsPath, filename), "utf8");
      const { attributes } = parseFrontmatter(file.toString());

      invariant(
        isValidPostAttributes(attributes),
        `${filename} has bad metadata`
      );

      return {
        slug: filename.replace(/\.md$/, ""),
        description: attributes.description,
        draft: attributes.draft,
        title: attributes.title,
      };
    })
  );

  return posts.filter((post) => !post.draft);
}
