// The Open Graph card generator renders with its own Playwright dependency,
// which can be a different version from @playwright/test and expect a
// different Chromium revision. With PLAYWRIGHT_BROWSERS_PATH=0, as on Netlify,
// each Playwright version also looks for browsers inside its own package
// folder. Installing Chromium through the generator's copy of Playwright puts
// the revision it needs where it looks for it.
//
// Extra arguments are passed through, for example `--with-deps` in CI.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const requireFromGenerator = createRequire(
  require.resolve("@schalkneethling/opengraph-cards-maker"),
);
const playwrightDir = path.dirname(
  requireFromGenerator.resolve("playwright/package.json"),
);
const playwrightCli = path.join(playwrightDir, "cli.js");

const result = spawnSync(
  process.execPath,
  [playwrightCli, "install", ...process.argv.slice(2), "chromium"],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
