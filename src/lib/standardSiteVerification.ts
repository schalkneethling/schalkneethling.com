const publicationRoute = "site.standard.publication";
const documentRoute = "site.standard.document";

export const getDocumentVerificationLink = (
  documentAtUri: string | undefined,
) =>
  documentAtUri ? { rel: documentRoute, href: documentAtUri } : undefined;

export const getPublicationDiscoveryLink = (
  publicationAtUri: string | undefined,
) =>
  publicationAtUri
    ? { rel: publicationRoute, href: publicationAtUri }
    : undefined;

export const getPublicationVerificationPaths = (
  publicationAtUri: string | undefined,
) =>
  publicationAtUri
    ? [
        {
          params: { publication: publicationRoute },
          props: { publicationAtUri },
        },
      ]
    : [];

export const createPublicationVerificationResponse = (
  publicationAtUri: string,
) =>
  new Response(publicationAtUri, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
