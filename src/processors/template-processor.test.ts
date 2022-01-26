import mock from "mock-fs";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

import { marked } from "marked";

import {
  loadTemplate,
  setMain,
  setMetadata,
} from "../../lib/processors/template-processor.js";

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
  "public/post-one.html": mock.load(
    path.resolve(__dirname, "../../mocks/post-one/index.html")
  ),
};

describe("Template Processor", () => {
  beforeEach(() => {
    mock(fileSystem);
  });

  afterEach(() => {
    mock.restore();
  });

  it("loads and returns the template HTML", () => {
    let expected = mock.bypass(() =>
      fs.readFileSync(path.resolve(__dirname, "../../mocks/_base.html"), "utf8")
    );
    const tmpl = loadTemplate("_base.html");
    expect(tmpl).toBe(expected);
  });

  it("replaces {{ main }} in template with post content", () => {
    const markdown = mock.bypass(() =>
      fs.readFileSync(
        path.resolve(__dirname, "../../mocks/post-one.md"),
        "utf8"
      )
    );
    const tmpl = loadTemplate("_base.html");
    const grayMatter = matter(markdown);
    const postContent = marked(grayMatter.content);

    expect(tmpl).toEqual(expect.stringContaining("{{ main }}"));

    const output = setMain(postContent, tmpl);

    expect(output).toEqual(expect.not.stringContaining("{{ main }}"));
  });

  it("replaces {{ title }} and {{ description }} in template with frontmatter", () => {
    const markdown = mock.bypass(() =>
      fs.readFileSync(
        path.resolve(__dirname, "../../mocks/post-one.md"),
        "utf8"
      )
    );
    const grayMatter = matter(markdown);

    const tmpl = loadTemplate(grayMatter.data.template);

    expect(tmpl).toEqual(expect.stringContaining("{{ title }}"));
    expect(tmpl).toEqual(expect.stringContaining("{{ description }}"));

    const output = setMetadata(grayMatter.data, tmpl);

    expect(output).toEqual(expect.not.stringContaining("{{ title }}"));
    expect(output).toEqual(expect.not.stringContaining("{{ description }}"));
  });
});
