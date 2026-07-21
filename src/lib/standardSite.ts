export type StandardSiteRgbColor = {
  readonly $type: "site.standard.theme.color#rgb";
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

export type StandardSitePublicationConfig = {
  readonly identity: {
    readonly handle: string;
    readonly did?: string;
    readonly publicationAtUri?: string;
  };
  readonly record: {
    readonly $type: "site.standard.publication";
    readonly url: string;
    readonly name: string;
    readonly description: string;
    readonly basicTheme: {
      readonly $type: "site.standard.theme.basic";
      readonly background: StandardSiteRgbColor;
      readonly foreground: StandardSiteRgbColor;
      readonly accent: StandardSiteRgbColor;
      readonly accentForeground: StandardSiteRgbColor;
    };
    readonly preferences: {
      readonly showInDiscover: boolean;
    };
  };
};

export const standardSite = {
  identity: {
    handle: "schalkneethling.com",
    did: "did:plc:brimpw7k46xczmr4pqst45df",
    // Set after the publication record has been created successfully.
    publicationAtUri: undefined,
  },
  record: {
    $type: "site.standard.publication",
    url: "https://schalkneethling.com",
    name: "Schalk Neethling - Open Web, Open Source, and Web Accessibility",
    description:
      "My thoughts, ideas, experiences, and ramblings about code, life, and the open web",
    basicTheme: {
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
    },
    preferences: {
      showInDiscover: true,
    },
  },
} as const satisfies StandardSitePublicationConfig;
