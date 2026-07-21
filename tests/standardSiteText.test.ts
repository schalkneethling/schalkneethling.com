import { describe, expect, it } from "vitest";

import { standardSite } from "../src/lib/standardSite";
import { createDocumentPayloads } from "../src/lib/standardSitePayloads";
import { extractStandardSiteText } from "../src/lib/standardSiteText";

describe("Standard.site plain-text extraction", () => {
  it("preserves meaningful Markdown prose without frontmatter or fenced code", () => {
    const markdown = `---
title: Hidden metadata
---
# A useful heading

A paragraph with [a useful link](https://example.com) and \`inline code\`.

- First item
- Second item

\`\`\`js
console.log("implementation noise");
\`\`\``;

    expect(extractStandardSiteText(markdown)).toBe(
      [
        "A useful heading",
        "A paragraph with a useful link and inline code.",
        "First item",
        "Second item",
      ].join("\n"),
    );
  });

  it("preserves prose inside MDX components without imports or JSX syntax", () => {
    const mdx = `import Aside from "../Aside.astro";

<Aside tone="note">
  Component-wrapped **prose** remains useful.
</Aside>

<Video src="demo.mp4" />

The final paragraph includes {dynamicValue} only as prose.`;

    expect(extractStandardSiteText(mdx)).toBe(
      [
        "Component-wrapped prose remains useful.",
        "The final paragraph includes only as prose.",
      ].join("\n"),
    );
  });

  it("adds extracted text to a document payload", () => {
    const payload = createDocumentPayloads(
      [
        {
          id: "example-post",
          body: "## Example\n\nDiscoverable **post prose**.",
          data: {
            title: "Example post",
            description: "An example.",
            pubDate: new Date("2026-07-01T00:00:00.000Z"),
            tags: ["atproto"],
            standardSite: { publish: true },
          },
        },
      ],
      standardSite,
    )[0];

    expect(payload?.textContent).toBe("Example\nDiscoverable post prose.");
  });
});
