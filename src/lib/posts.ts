import { getCollection } from "astro:content";

import { isPublishedPost, sortPostsByPubDateDesc } from "./postFilters";

export async function getPublishedPosts(now = new Date()) {
  const posts = await getCollection("posts");

  return posts.filter((post) => isPublishedPost(post, now));
}

export { isPublishedPost, sortPostsByPubDateDesc };

