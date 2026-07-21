import type { StandardSitePublicationConfig } from "./standardSite";
import { extractStandardSiteText } from "./standardSiteText.ts";

export interface StandardSitePost {
  readonly id: string;
  readonly body?: string;
  readonly data: {
    readonly title: string;
    readonly description: string;
    readonly pubDate: Date;
    readonly tags: readonly string[];
    readonly canonical?: string;
    readonly standardSite?: {
      readonly publish: boolean;
      readonly documentAtUri?: string;
    };
  };
}

export type StandardSiteDocumentPayload = {
  readonly $type: "site.standard.document";
  readonly site: string;
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly tags: readonly string[];
  readonly textContent?: string;
};

function getEligibleDocumentUrl(post: StandardSitePost, siteOrigin: string) {
  const documentUrl = post.data.canonical
    ? new URL(post.data.canonical)
    : new URL(`/posts/${post.id}/`, siteOrigin);

  return documentUrl.origin === siteOrigin ? documentUrl : undefined;
}

export function createPublicationPayload(
  config: StandardSitePublicationConfig,
) {
  return config.record;
}

export function createDocumentPayloads(
  posts: readonly StandardSitePost[],
  config: StandardSitePublicationConfig,
): StandardSiteDocumentPayload[] {
  const site = config.identity.publicationAtUri ?? config.record.url;
  const siteOrigin = new URL(config.record.url).origin;

  return posts
    .toSorted((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .flatMap((post) => {
      if (post.data.standardSite?.publish !== true) {
        return [];
      }

      const documentUrl = getEligibleDocumentUrl(post, siteOrigin);

      if (!documentUrl) {
        return [];
      }

      const textContent = post.body
        ? extractStandardSiteText(post.body)
        : undefined;

      return [
        {
          $type: "site.standard.document",
          site,
          path: `${documentUrl.pathname}${documentUrl.search}${documentUrl.hash}`,
          title: post.data.title,
          description: post.data.description,
          publishedAt: post.data.pubDate.toISOString(),
          tags: [...post.data.tags],
          ...(textContent ? { textContent } : {}),
        },
      ];
    });
}
