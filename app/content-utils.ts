import fs from "fs/promises";

import invariant from "tiny-invariant";
import { marked } from "marked";
import parseFrontmatter from "front-matter";

import { isValidPostAttributes } from "./posts";
import { renderer } from "./renderer";

export async function getContents(filePath: string) {
  const file = await fs.readFile(filePath, "utf8");
  const { attributes, body } = parseFrontmatter(file.toString());
  invariant(
    isValidPostAttributes(attributes),
    `Post ${filePath} is missing attributes`
  );
  marked.use({
    gfm: true,
    renderer,
  });
  const html = marked(body);
  return { html, title: attributes.title };
}
