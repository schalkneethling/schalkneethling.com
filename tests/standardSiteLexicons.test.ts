import { describe, expect, it } from "vitest";

import * as Document from "../src/lexicons/site/standard/document.defs";
import * as Publication from "../src/lexicons/site/standard/publication.defs";
import { standardSite } from "../src/lib/standardSite";
import {
  createDocumentPayloads,
  createPublicationPayload,
} from "../src/lib/standardSitePayloads";

const selectedPost = {
  id: "lexicon-validation",
  body: "A representative document.",
  data: {
    title: "Lexicon validation",
    description: "A representative Standard.site document.",
    pubDate: new Date("2026-07-21T10:00:00.000Z"),
    tags: ["atproto"],
    standardSite: { publish: true },
  },
};

describe("pinned Standard.site Lexicons", () => {
  it("validates the publication payload", () => {
    expect(() =>
      Publication.$assert(createPublicationPayload(standardSite)),
    ).not.toThrow();
  });

  it("validates a representative document payload", () => {
    const document = createDocumentPayloads([selectedPost], standardSite)[0];

    expect(() => Document.$assert(document)).not.toThrow();
  });
});
