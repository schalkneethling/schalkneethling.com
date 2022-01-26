import mock from "mock-fs";

import { getPosts } from "../lib/fileUtils.js";

const fileSystem = {
  ".env": `
    OUTPUT_DIR="./public"
    POSTS_ROOT="./posts"
    TEMPLATE_DIR="./tmpl"
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
  beforeEach(() => {
    mock(fileSystem);
  });

  afterEach(() => {
    mock.restore();
  });

  it("returns a list of posts in directory", () => {
    const posts = getPosts();

    expect(posts).toHaveLength(3);
  });

  it("returns a list with the expected file names", () => {
    const posts = getPosts();

    posts.forEach((post, index) => {
      expect(post.fileName).toMatch(expectedFileNames[index]);
    });
  });
});
