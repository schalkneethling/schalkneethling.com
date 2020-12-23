#!/usr/bin/env node
import fse from "fs-extra";
import marked from "marked";
import * as matter from "gray-matter";

import { getPosts } from "./fileUtils";
import {
  setMain,
  loadTemplate,
  setMetadata,
} from "./processors/template-processor";

require("dotenv").config();

const OUTPUT_DIR = process.env.OUTPUT_DIR;

const parseDoc = () => {
  const posts = getPosts();

  posts.forEach((post) => {
    console.info(`Processing ${post.path}`);
    const fileContents = fse.readFileSync(post.path, "utf-8");
    const grayMatter = matter.default(fileContents);

    if (!grayMatter.data.template) {
      throw new Error(
        `Please specify a template using frontMatter for ${post.path}`
      );
    }

    const tmpl = loadTemplate(grayMatter.data.template);

    let processed = setMetadata(grayMatter.data, tmpl);
    let postHTML = marked(grayMatter.content);
    processed = setMain(postHTML, processed);

    fse.outputFileSync(
      `${OUTPUT_DIR}/${post.fileName}.html`,
      processed,
      "utf-8"
    );
  });
};

parseDoc();

module.exports = parseDoc;
