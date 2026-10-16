import { describe, expect, it } from "vitest";

import {
  formatUtcDate,
  planDraftPublication,
  resolveDraftFileName,
} from "../src/lib/draftPublishing";

const now = new Date("2026-10-16T12:00:00.000Z");

const draftSource = `---
title: "Overriding a vi.doMock Factory in Vitest 4"
pubDate: 2026-06-25
description: "Why re-calling vi.doMock stopped working in Vitest 4."
author: "Schalk Neethling"
tags: [testing, javascript, vitest]
---

The body of the post.
`;

function planFor(
  overrides: Partial<Parameters<typeof planDraftPublication>[0]>,
) {
  return planDraftPublication({
    draftFileName: "vitest4-do-mock-factories.md",
    draftSource,
    existingPostFileNames: ["what-is-wcag.md", "understanding-local.mdx"],
    publishDate: "2026-10-16",
    now,
    ...overrides,
  });
}

describe("planDraftPublication", () => {
  it("sets the publication date and leaves every other byte unchanged", () => {
    const result = planFor({});

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.plan).toMatchObject({
      slug: "vitest4-do-mock-factories",
      draftFileName: "vitest4-do-mock-factories.md",
      postFileName: "vitest4-do-mock-factories.md",
      title: "Overriding a vi.doMock Factory in Vitest 4",
      previousPubDate: "2026-06-25",
      pubDate: "2026-10-16",
    });
    expect(result.plan.source).toBe(
      draftSource.replace("pubDate: 2026-06-25", "pubDate: 2026-10-16"),
    );
  });

  it("replaces a quoted publication date with a YAML date", () => {
    const result = planFor({
      draftSource: draftSource.replace(
        "pubDate: 2026-06-25",
        'pubDate: "2026-06-25"',
      ),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.plan.source).toContain("\npubDate: 2026-10-16\n");
  });

  it("preserves Windows line endings", () => {
    const result = planFor({
      draftSource: draftSource.replaceAll("\n", "\r\n"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.plan.source).toBe(
      draftSource
        .replace("pubDate: 2026-06-25", "pubDate: 2026-10-16")
        .replaceAll("\n", "\r\n"),
    );
  });

  it.each(["vitest4-do-mock-factories.md", "vitest4-do-mock-factories.mdx"])(
    "refuses to overwrite the existing post %s",
    (existingPost) => {
      const result = planFor({ existingPostFileNames: [existingPost] });

      expect(result).toEqual({
        ok: false,
        errors: [
          `A post with the slug "vitest4-do-mock-factories" already exists: src/content/posts/${existingPost}`,
        ],
      });
    },
  );

  it("reports frontmatter that does not satisfy the posts schema", () => {
    const result = planFor({
      draftSource: draftSource.replace(
        'description: "Why re-calling vi.doMock stopped working in Vitest 4."\n',
        "",
      ),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors).toEqual([expect.stringContaining("description")]);
  });

  it("refuses a draft without frontmatter", () => {
    const result = planFor({ draftSource: "Just a body.\n" });

    expect(result).toEqual({
      ok: false,
      errors: ["The draft does not start with a YAML frontmatter block."],
    });
  });

  it("refuses a draft without a pubDate field to update", () => {
    const result = planFor({
      draftSource: draftSource.replace("pubDate: 2026-06-25\n", ""),
    });

    expect(result).toEqual({
      ok: false,
      errors: ["The draft frontmatter has no pubDate field to update."],
    });
  });

  it("refuses a draft without body content", () => {
    const frontmatterOnly = draftSource.replace(
      "\nThe body of the post.\n",
      "",
    );
    const result = planFor({ draftSource: frontmatterOnly });

    expect(result).toEqual({
      ok: false,
      errors: ["The draft has no content after its frontmatter."],
    });
  });

  it.each(["2026-13-01", "2026-02-30", "16-10-2026", "2026-10-16T08:00"])(
    "refuses the malformed publication date %s",
    (publishDate) => {
      const result = planFor({ publishDate });

      expect(result).toEqual({
        ok: false,
        errors: [
          `The publication date "${publishDate}" is not a valid YYYY-MM-DD calendar date.`,
        ],
      });
    },
  );

  it("refuses a future publication date because the static build would hide the post", () => {
    const result = planFor({ publishDate: "2026-10-17" });

    expect(result).toEqual({
      ok: false,
      errors: [
        "The publication date 2026-10-17 is after the current UTC time, so the build would hide this post until a later deploy.",
      ],
    });
  });

  it("refuses a draft file name that would not match its URL slug", () => {
    const result = planFor({ draftFileName: "My Draft.md" });

    expect(result).toEqual({
      ok: false,
      errors: [
        'The draft file name "My Draft.md" must be a lowercase kebab-case slug ending in .md or .mdx.',
      ],
    });
  });
});

describe("resolveDraftFileName", () => {
  const draftFileNames = ["abort-controller-pattern.md", "local-fonts.mdx"];

  it.each([
    ["abort-controller-pattern", "abort-controller-pattern.md"],
    ["abort-controller-pattern.md", "abort-controller-pattern.md"],
    ["src/content/drafts/local-fonts.mdx", "local-fonts.mdx"],
  ])("resolves %s", (input, expected) => {
    expect(resolveDraftFileName(input, draftFileNames)).toEqual({
      ok: true,
      draftFileName: expected,
    });
  });

  it("lists the available drafts when nothing matches", () => {
    expect(resolveDraftFileName("missing", draftFileNames)).toEqual({
      ok: false,
      errors: [
        'No draft named "missing" in src/content/drafts. Available drafts: abort-controller-pattern, local-fonts',
      ],
    });
  });

  it("refuses an ambiguous slug that exists as both .md and .mdx", () => {
    expect(
      resolveDraftFileName("local-fonts", [
        "local-fonts.md",
        "local-fonts.mdx",
      ]),
    ).toEqual({
      ok: false,
      errors: [
        'The slug "local-fonts" matches more than one draft: local-fonts.md, local-fonts.mdx',
      ],
    });
  });
});

describe("formatUtcDate", () => {
  it("uses the UTC calendar date so the default never lands in the future", () => {
    expect(formatUtcDate(new Date("2026-10-16T23:30:00.000-02:00"))).toBe(
      "2026-10-17",
    );
    expect(formatUtcDate(new Date("2026-10-17T01:30:00.000+02:00"))).toBe(
      "2026-10-16",
    );
  });
});
