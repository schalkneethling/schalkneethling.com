import { resolve } from "node:path";

import { standardSite } from "../src/lib/standardSite.ts";
import { validateStandardSiteBuild } from "../src/lib/standardSiteBuildValidation.ts";

const publicationAtUri = standardSite.identity.publicationAtUri;

if (!publicationAtUri) {
  throw new Error(
    "Standard.site build validation requires a publication AT-URI",
  );
}

const result = await validateStandardSiteBuild({
  distDirectory: resolve("dist"),
  postsDirectory: resolve("src/content/posts"),
  publicationAtUri,
});

console.log(
  `Standard.site build valid: ${result.htmlFileCount} HTML files and ${result.documentCount} document verification links checked`,
);
