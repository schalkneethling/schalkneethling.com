import { Link, useLoaderData } from "remix";

import { getPosts } from "~/posts";
import type { Post } from "~/posts";

export const loader = async () => {
  return getPosts();
};

export default function Posts() {
  const posts = useLoaderData();
  return (
    <>
      <h1>My posts</h1>
      <ul>
        {posts.map((post: Post) => (
          <li key={post.slug} className="post-card">
            <h3>
              <Link to={post.slug}>{post.title}</Link>
            </h3>
            <p>{post.description}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
