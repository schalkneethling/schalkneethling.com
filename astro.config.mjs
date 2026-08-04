import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://schalkneethling.com/",
  markdown: {
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ["math", "mermaid"],
    },
    shikiConfig: { theme: "dracula" },
  },
  redirects: {
    "/now": {
      status: 301,
      destination: "/about",
    },
  },
  integrations: [mdx()],
});
