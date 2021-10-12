const mock = require("mock-fs");
const fs = require("fs");
const klawSync = require("klaw-sync");
const path = require("path");

const parseDoc = require("./index");

const filesystem = {
  ".env": `
    OUTPUT_DIR: "./public"
    POSTS_ROOT: "./posts"
  `,
  "tmpl/_base.html": mock.load(path.resolve(__dirname, "../mocks/_base.html")),
  "sass/main.scss": mock.load(
    path.resolve(__dirname, "../mocks/sass/main.scss")
  ),
  "posts/post-one.md": mock.load(
    path.resolve(__dirname, "../mocks/post-one.md")
  ),
  "posts/post-two.md": mock.load(
    path.resolve(__dirname, "../mocks/post-two.md")
  ),
};

describe("parseDoc", () => {
  afterEach(() => {
    mock.restore();
  });

  it("reads, parses and writes the resulting HTML to disk", () => {
    // deepcode ignore WrongNumberOfArgs/test: this is a false positive
    mock(filesystem);

    parseDoc();

    // deepcode ignore ExpectsArray/test: this is a false positive
    const files = klawSync("./public", {
      nodir: true,
      filter: (item) => {
        return !item.path.endsWith(".css");
      },
    });

    expect(files).toHaveLength(2);

    files.forEach((file) => {
      const pathPartsArray = path.dirname(file.path).split(path.sep);
      const postFolderPath = pathPartsArray[pathPartsArray.length - 1];
      const fileName = path.basename(file.path);
      const expected = mock.bypass(() =>
        fs.readFileSync(
          path.resolve(__dirname, `../mocks/${postFolderPath}/${fileName}`),
          "utf8"
        )
      );
      const fileContents = fs.readFileSync(file.path, "utf8");

      expect(fileContents).toBe(expected);
    });
  });
});
