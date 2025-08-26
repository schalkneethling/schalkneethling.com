import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
export default defineConfig({
  tokens: [
    "./design-tokens/spacing.json",
    "./design-tokens/colors.json",
    "./design-tokens/typography.json",
    "./design-tokens/borders.json",
  ],
  plugins: [
    css({
      utility: {
        font: ["typography.*"],
      },
    }),
  ],
  outDir: "./src/styles/tokens/",
  lint: {
    /** @see https://terrazzo.app/docs/cli/lint */
  },
});
