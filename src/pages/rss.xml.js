import rss from "@astrojs/rss";
import { getPublishedPosts, sortPostsByPubDateDesc } from "../lib/posts";

export async function GET(context) {
  const posts = await getPublishedPosts();
  const sortedPosts = sortPostsByPubDateDesc(posts);

  return rss({
    title: "Schalk Neethling - Open Web, Open Source, and Web Accessibility",
    description:
      "My thoughts, ideas, experiences, and ramblings about code, life, and the open web",
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
