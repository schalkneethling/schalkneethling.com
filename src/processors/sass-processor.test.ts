import mock from "mock-fs";
import path from "path";
import { fileURLToPath } from "url";

import { processSASS } from "../../lib/processors/sass-processor.js";
import { loadTemplate } from "../../lib/processors/template-processor.js";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileSystem = {
  ".env": `
    OUTPUT_DIR="./public"
    POSTS_ROOT="./posts"
    TEMPLATE_DIR="./tmpl"
  `,
  "tmpl/_base.html": mock.load(
    path.resolve(__dirname, "../../mocks/_base.html")
  ),
  "sass/main.scss": mock.load(
    path.resolve(__dirname, "../../mocks/sass/main.scss")
  ),
};

describe("SASS Processor", () => {
  beforeEach(() => {
    mock(fileSystem);
  });

  afterEach(() => {
    mock.restore();
  });

  it("loads template, process sass, rewrites link tag, returns HTML", () => {
    const tmpl = loadTemplate("_base.html");
    const processedHTML = processSASS(tmpl);

    expect(processedHTML).not.toContain(
      '<link rel="stylesheet" type="text/sass" href="sass/main.scss" media="screen"/>'
    );
    expect(processedHTML).toContain(
      '<link rel="stylesheet" type="text/css" href="../css/main.css" media="screen"/>'
    );
  });
});
