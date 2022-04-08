import { useLoaderData } from "remix";
import type { LoaderFunction } from "remix";
import invariant from "tiny-invariant";

import { getPage } from "~/pages";

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, "expected params.slug");
  return getPage(params.slug);
};

export default function PageSlug() {
  const page = useLoaderData();
  return (
    <main className="standard-layout">
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
    </main>
  );
}
