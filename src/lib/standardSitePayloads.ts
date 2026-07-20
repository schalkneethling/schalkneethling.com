import type { StandardSitePublicationConfig } from "./standardSite";

const siteOrigin = "https://schalkneethling.com";

interface StandardSitePost {
  readonly id: string;
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
};

function getEligibleDocumentUrl(post: StandardSitePost) {
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

  return posts
    .toSorted((a, b) => a.id.localeCompare(b.id))
    .flatMap((post) => {
      if (post.data.standardSite?.publish !== true) {
        return [];
      }

      const documentUrl = getEligibleDocumentUrl(post);

      if (!documentUrl) {
        return [];
      }

      return [
        {
          $type: "site.standard.document",
          site,
          path: `${documentUrl.pathname}${documentUrl.search}${documentUrl.hash}`,
          title: post.data.title,
          description: post.data.description,
          publishedAt: post.data.pubDate.toISOString(),
          tags: [...post.data.tags],
        },
      ];
    });
}
