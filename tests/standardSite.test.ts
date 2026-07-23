import { describe, expect, it } from "vitest";

import { standardSite } from "../src/lib/standardSite";

describe("standardSite publication configuration", () => {
  it("pins the publisher identity and publication AT-URI", () => {
    expect(standardSite.identity.handle).toBe("schalkneethling.com");
    expect(standardSite.identity.did).toBe("did:plc:brimpw7k46xczmr4pqst45df");
    expect(standardSite.identity.publicationAtUri).toBe(
      "at://did:plc:brimpw7k46xczmr4pqst45df/site.standard.publication/3mrd3atn7qc2y",
    );
    expect(standardSite.record).toMatchObject({
      $type: "site.standard.publication",
      url: "https://schalkneethling.com",
      name: "Schalk Neethling - Open Web, Open Source, and Web Accessibility",
      description:
        "My thoughts, ideas, experiences, and ramblings about code, life, and the open web",
      preferences: { showInDiscover: true },
    });
  });

  it("uses the existing light, dark, and accent palette values", () => {
    expect(standardSite.record.basicTheme).toMatchObject({
      $type: "site.standard.theme.basic",
      background: {
        $type: "site.standard.theme.color#rgb",
        r: 247,
        g: 251,
        b: 254,
      },
      foreground: {
        $type: "site.standard.theme.color#rgb",
        r: 1,
        g: 42,
        b: 74,
      },
      accent: {
        $type: "site.standard.theme.color#rgb",
        r: 1,
        g: 79,
        b: 134,
      },
      accentForeground: {
        $type: "site.standard.theme.color#rgb",
        r: 247,
        g: 251,
        b: 254,
      },
    });
  });
});
