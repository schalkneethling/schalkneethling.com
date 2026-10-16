import type { APIRoute } from "astro";

/**
 * The commit this build was made from, so the deploy monitor can tell when a
 * merge is live. Netlify sets COMMIT_REF during builds; local builds have none.
 */
export const GET: APIRoute = () =>
  new Response(`${process.env.COMMIT_REF ?? "unknown"}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
