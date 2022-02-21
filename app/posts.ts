import path from "path";
import { promises as fs } from "fs";
import parseFrontmatter from "front-matter";
import invariant from "tiny-invariant";
import { marked } from "marked";

export type Post = {
  description: string;
  slug: string;
  title: string;
};

export type PostMarkdownAttributes = {
  description: string;
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
  const html = marked(body);
  return { slug, html, title: attributes.title };
}

export async function getPosts() {
  const dir = await fs.readdir(postsPath);

  return Promise.all(
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
        title: attributes.title,
      };
    })
  );
}
