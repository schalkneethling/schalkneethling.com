import rss, { pagesGlobToRssItems } from "@astrojs/rss";

export async function GET(context) {
  return rss({
    title: "Schalk Neethling - Open Web, Open Source, and Web Accessibility",
    description: "My thoughts, ideas, experiences, and ramblings about code, life, and the open web",
    site: context.site,
    items: await pagesGlobToRssItems(import.meta.glob("./**/*.md")),
    customData: `<language>en-us</language>`,
  });
}
