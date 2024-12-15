import rss, { pagesGlobToRssItems } from "@astrojs/rss";

const defaultSort = await pagesGlobToRssItems(import.meta.glob("./**/*.md"));
const sortedPosts = defaultSort.toSorted(
  (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
);

export async function GET(context) {
  return rss({
    title: "Schalk Neethling - Open Web, Open Source, and Web Accessibility",
    description:
      "My thoughts, ideas, experiences, and ramblings about code, life, and the open web",
    site: context.site,
    items: sortedPosts,
    customData: `<language>en-us</language>`,
  });
}
