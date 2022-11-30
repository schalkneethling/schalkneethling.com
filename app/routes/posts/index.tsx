import { LinksFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Card, links as CardStyles } from "~/components/organisms/card";
import { getPosts } from "~/posts";
import type { Post } from "~/posts";

import styles from "~/styles/posts/index.css";

export const links: LinksFunction = () => [
  ...CardStyles(),
  { rel: "stylesheet", href: styles },
];

export const loader = async () => {
  return getPosts();
};

export default function Posts() {
  const posts = useLoaderData();
  return (
    <main className="standard-layout">
      <h1>My writing</h1>
      <ul className="reset-list posts-list">
        {posts.map((post: Post) => (
          <Card type="listItem" key={post.slug}>
            <h3>
              <Link to={post.slug}>{post.title}</Link>
            </h3>
            <p>{post.description}</p>
          </Card>
        ))}
      </ul>
    </main>
  );
}
