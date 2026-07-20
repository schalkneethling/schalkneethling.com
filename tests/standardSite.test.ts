import { describe, expect, it } from "vitest";

import { standardSite } from "../src/lib/standardSite";

describe("standardSite publication configuration", () => {
  it("provides publication metadata without requiring remote identifiers", () => {
    expect(standardSite.identity.did).toBeUndefined();
    expect(standardSite.identity.publicationAtUri).toBeUndefined();
    expect(standardSite.record).toMatchObject({
      $type: "site.standard.publication",
      url: "https://schalkneethling.com",
      preferences: { showInDiscover: true },
    });
  });

  it("uses the existing light, dark, and accent palette values", () => {
    expect(standardSite.record.basicTheme).toMatchObject({
      background: { r: 247, g: 251, b: 254 },
      foreground: { r: 1, g: 42, b: 74 },
      accent: { r: 1, g: 79, b: 134 },
      accentForeground: { r: 247, g: 251, b: 254 },
    });
  });
});
