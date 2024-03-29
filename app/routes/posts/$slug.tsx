import { useLoaderData } from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import invariant from "tiny-invariant";

import { getPost } from "~/posts";
import highlightStyles from "highlight.js/styles/github.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: highlightStyles },
];

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, "expected params.slug");
  return getPost(params.slug);
};

export default function PostSlug() {
  const post = useLoaderData();
  return (
    <main className="standard-layout">
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </main>
  );
}
