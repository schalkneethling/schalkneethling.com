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
    mock(filesystem);

    parseDoc();

    const files = klawSync("./public", { nodir: true });
    expect(files).toHaveLength(2);
    files.forEach((file) => {
      let fileName = path.basename(file.path);
      let expected = mock.bypass(() =>
        fs.readFileSync(path.resolve(__dirname, `../mocks/${fileName}`), "utf8")
      );
      let fileContents = fs.readFileSync(file.path, "utf8");

      expect(fileContents).toMatch(expected);
    });
  });
});
