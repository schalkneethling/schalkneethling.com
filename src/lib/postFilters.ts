type PostWithPubDate = {
  data: {
    pubDate: Date;
  };
};

export function isPublishedPost(post: PostWithPubDate, now = new Date()) {
  return post.data.pubDate.getTime() <= now.getTime();
}

export function sortPostsByPubDateDesc<TPost extends PostWithPubDate>(
  posts: TPost[],
) {
  return posts.toSorted(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
}

