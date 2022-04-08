import path from "path";

import { getContents } from "./content-utils";

export type Page = {
  description: string;
  slug: string;
  title: string;
};

const pagesPath = path.join(__dirname, "../../../..", "pages");

export async function getPage(slug: string) {
  const filepath = path.join(pagesPath, `${slug}.md`);
  const { html, title } = await getContents(filepath);
  return { slug, html, title };
}
