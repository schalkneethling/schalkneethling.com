const mock = require("mock-fs");
const fs = require("fs");
const path = require("path");

import { loadTemplate } from "./template-processor";

const fileSystem = {
  ".env": `
    OUTPUT_DIR="./public"
    POSTS_ROOT="./posts"
    TEMPLATE_DIR="./tmpl"
  `,
  "tmpl/_base.html": mock.load(
    path.resolve(__dirname, "../../mocks/_base.html")
  ),
};

describe("Template Processor", () => {
  afterEach(() => {
    mock.restore();
  });

  it("loads and returns the template HTML", () => {
    mock(fileSystem);
    let expected = mock.bypass(() =>
      fs.readFileSync(path.resolve(__dirname, "../../mocks/_base.html"), "utf8")
    );
    const tmpl = loadTemplate();
    expect(tmpl).toBe(expected);
  });
});
