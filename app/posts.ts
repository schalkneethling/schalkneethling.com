import path from "path";
import { promises as fs } from "fs";

import invariant from "tiny-invariant";
import { marked } from "marked";
import parseFrontmatter from "front-matter";

import { renderer } from "./renderer";

export type Post = {
  description: string;
  slug: string;
  title: string;
};

export type PostMarkdownAttributes = {
  description: string;
  draft?: boolean;
  title: string;
};

const postsPath = path.join(__dirname, "../../../..", "posts");

function isValidPostAttributes(
  attributes: any
): attributes is PostMarkdownAttributes {
  return attributes?.title && attributes?.description;
}

export async function getPost(slug: string) {
  const filepath = path.join(postsPath, `${slug}.md`);
  const file = await fs.readFile(filepath, "utf8");
  const { attributes, body } = parseFrontmatter(file.toString());
  invariant(
    isValidPostAttributes(attributes),
    `Post ${filepath} is missing attributes`
  );
  marked.use({
    gfm: true,
    renderer,
  });
  const html = marked(body);
  return { slug, html, title: attributes.title };
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
