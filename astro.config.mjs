import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://schalkneethling.com/",
  redirects: {
    "/now": {
      status: 301,
      destination: "/about",
    },
  },
  integrations: [
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: { theme: "dracula" },
    }),
  ],
});
