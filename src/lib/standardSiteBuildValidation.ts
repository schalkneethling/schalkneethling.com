import { glob, readFile } from "node:fs/promises";
import { join } from "node:path";

import { DOMParser } from "linkedom";
import { parseDocument } from "yaml";

const publicationRelation = "site.standard.publication";
const documentRelation = "site.standard.document";

type StandardSiteBuildValidationOptions = {
  readonly distDirectory: string;
  readonly postsDirectory: string;
  readonly publicationAtUri: string;
};

type ConfiguredDocument = {
  readonly documentAtUri: string;
  readonly sourcePath: string;
  readonly htmlPath: string;
};

type DiscoveredDocument = {
  readonly documentAtUri: string;
  readonly htmlPath: string;
};

function getHtmlDocument(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

async function getConfiguredDocuments(
  postsDirectory: string,
  distDirectory: string,
) {
  const configuredDocuments: ConfiguredDocument[] = [];

  for await (const relativePath of glob(["**/*.md", "**/*.mdx"], {
    cwd: postsDirectory,
  })) {
    const sourcePath = join(postsDirectory, relativePath);
    const source = await readFile(sourcePath, "utf8");
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u);

    if (!frontmatter) {
      continue;
    }

    const document = parseDocument(frontmatter[1]);

    if (document.errors.length > 0) {
      throw new Error(`Invalid frontmatter in ${sourcePath}`);
    }

    const documentAtUri = document.getIn(["standardSite", "documentAtUri"]);

    if (typeof documentAtUri === "string") {
      const postId = relativePath.replace(/\.mdx?$/u, "");
      configuredDocuments.push({
        documentAtUri,
        sourcePath,
        htmlPath: join(distDirectory, "posts", postId, "index.html"),
      });
    }
  }

  return configuredDocuments;
}

export async function validateStandardSiteBuild({
  distDirectory,
  postsDirectory,
  publicationAtUri,
}: StandardSiteBuildValidationOptions) {
  const errors: string[] = [];
  const verificationPath = join(
    distDirectory,
    ".well-known",
    publicationRelation,
  );
  const verificationValue = await readFile(verificationPath, "utf8");

  if (verificationValue !== publicationAtUri) {
    errors.push(
      `${verificationPath} does not contain the configured publication AT-URI`,
    );
  }

  const configuredDocuments = await getConfiguredDocuments(
    postsDirectory,
    distDirectory,
  );
  const configuredDocumentsByAtUri = Map.groupBy(
    configuredDocuments,
    ({ documentAtUri }) => documentAtUri,
  );
  const discoveredDocuments: DiscoveredDocument[] = [];
  let htmlFileCount = 0;

  for (const [documentAtUri, documents] of configuredDocumentsByAtUri) {
    if (documents.length > 1) {
      errors.push(
        `${documentAtUri} is configured by multiple posts: ${documents
          .map(({ sourcePath }) => sourcePath)
          .join(", ")}`,
      );
    }
  }

  for await (const relativePath of glob("**/*.html", {
    cwd: distDirectory,
  })) {
    htmlFileCount += 1;
    const htmlPath = join(distDirectory, relativePath);
    const html = await readFile(htmlPath, "utf8");
    const document = getHtmlDocument(html);
    const links = [...document.querySelectorAll("link")];
    const isRedirect = [...document.querySelectorAll("meta")].some(
      (meta) => meta.getAttribute("http-equiv")?.toLowerCase() === "refresh",
    );
    const hasPublicationLink = links.some(
      (link) =>
        link.getAttribute("rel") === publicationRelation &&
        link.getAttribute("href") === publicationAtUri,
    );

    if (!isRedirect && !hasPublicationLink) {
      errors.push(`${htmlPath} is missing the publication discovery link`);
    }

    for (const link of links) {
      const relation = link.getAttribute("rel");
      const href = link.getAttribute("href");

      if (relation !== documentRelation || !href) {
        continue;
      }

      discoveredDocuments.push({ documentAtUri: href, htmlPath });
    }
  }

  for (const configuredDocument of configuredDocuments) {
    const {
      documentAtUri,
      sourcePath,
      htmlPath: expectedHtmlPath,
    } = configuredDocument;
    const matchingLinks = discoveredDocuments.filter(
      (document) =>
        document.documentAtUri === documentAtUri &&
        document.htmlPath === expectedHtmlPath,
    );
    const misplacedLinks = discoveredDocuments.filter(
      (document) =>
        document.documentAtUri === documentAtUri &&
        document.htmlPath !== expectedHtmlPath,
    );

    if (matchingLinks.length !== 1) {
      errors.push(
        `${sourcePath} configures ${documentAtUri}, but ${expectedHtmlPath} emits it ${matchingLinks.length} times`,
      );
    }

    for (const { htmlPath } of misplacedLinks) {
      errors.push(
        `${htmlPath} emits ${documentAtUri}, but its configured page is ${expectedHtmlPath}`,
      );
    }
  }

  for (const { documentAtUri, htmlPath } of discoveredDocuments) {
    if (!configuredDocumentsByAtUri.has(documentAtUri)) {
      errors.push(
        `${htmlPath} emits ${documentAtUri}, but no post configures it`,
      );
    }
  }

  if (htmlFileCount === 0) {
    errors.push(`${distDirectory} does not contain any HTML files`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Standard.site build validation failed:\n- ${errors.join("\n- ")}`,
    );
  }

  return {
    htmlFileCount,
    documentCount: configuredDocuments.length,
  };
}
