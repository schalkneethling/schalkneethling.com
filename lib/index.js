#!/usr/bin/env node
const fse = require("fs-extra");
const marked = require("marked");

const { getPosts } = require("./fileUtils");

require("dotenv").config();

const OUTPUT_DIR = process.env.OUTPUT_DIR;

const parseDoc = () => {
  const posts = getPosts();

  posts.forEach((post) => {
    let markdown = marked(fse.readFileSync(post.path, "utf-8"));
    fse.outputFileSync(
      `${OUTPUT_DIR}/${post.fileName}.html`,
      markdown,
      "utf-8"
    );
  });
};

parseDoc();

module.exports = parseDoc;
