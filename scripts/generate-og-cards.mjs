import path from "node:path";
import {
  createCardsFromContentFiles,
  generateOpenGraphCards,
} from "@schalkneethling/opengraph-cards-maker";

const outputDir = path.resolve("public/og/posts");
const background = path.resolve("src/assets/open-graph/post-card-template.png");

const cards = await createCardsFromContentFiles({
  contentDir: "src/content/posts",
  extensions: [".md", ".mdx"],
  eyebrow: "Scripting on Caffeine",
  mapCard: (card) => ({
    ...card,
    background: {
      src: background,
    },
    contentAlign: "align-end",
    theme: {
      accent: "#89C2D9",
      foreground: "#F7FBFE",
      muted: "#EAF7FC",
    },
  }),
});

await generateOpenGraphCards({
  outputDir,
  cleanOutputDir: true,
  cards,
});

console.log(`Generated ${cards.length} post Open Graph card(s).`);
