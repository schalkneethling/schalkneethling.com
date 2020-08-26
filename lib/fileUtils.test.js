const mock = require("mock-fs");

const fileUtils = require("./fileUtils");

const fileSystem = {
  ".env": `
    OUTPUT_DIR: "./public"
    POSTS_ROOT: "./posts"
  `,
  "posts/form-validation-pattern.md": "",
  "posts/category/category-post.md": "",
  "posts/category/tag/category-tag-post.md": "",
};
const expectedFileNames = [
  "category-post",
  "category-tag-post",
  "form-validation-pattern",
];

describe("getPosts", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns a list of posts in directory", () => {
    mock(fileSystem);

    const posts = fileUtils.getPosts();

    expect(posts).toHaveLength(3);
  });

  it("returns a list with the expected file names", () => {
    mock(fileSystem);

    const posts = fileUtils.getPosts();

    posts.forEach((post, index) => {
      expect(post.fileName).toMatch(expectedFileNames[index]);
    });
  });
});
