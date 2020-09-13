#!/usr/bin/env node
import fse from "fs-extra";
import marked from "marked";

import { getPosts } from "./fileUtils";
import { addMain, loadTemplate } from "./processors/template-processor";

require("dotenv").config();

const OUTPUT_DIR = process.env.OUTPUT_DIR;

const parseDoc = () => {
  const posts = getPosts();
  const tmpl = loadTemplate();

  posts.forEach((post) => {
    let markdown = marked(fse.readFileSync(post.path, "utf-8"));
    let processed = addMain(markdown, tmpl);
    fse.outputFileSync(
      `${OUTPUT_DIR}/${post.fileName}.html`,
      processed,
      "utf-8"
    );
  });
};

parseDoc();

module.exports = parseDoc;
