#!/usr/bin/env node
import fse from "fs-extra";
import { marked } from "marked";
import * as matter from "gray-matter";

import { getPosts } from "./fileUtils.js";
import {
  loadTemplate,
  sassToCSS,
  setMain,
  setMetadata,
} from "./processors/template-processor.js";

import dotenv from "dotenv";
dotenv.config();

const OUTPUT_DIR = process.env.OUTPUT_DIR;

export const parseDoc = () => {
  const posts = getPosts();

  posts.forEach((post) => {
    console.info(`Processing ${post.path}`);
    const fileContents = fse.readFileSync(post.path, "utf8");
    const grayMatter = matter.default(fileContents);

    if (!grayMatter.data.template) {
      throw new Error(
        `Please specify a template using frontMatter for ${post.path}`
      );
    }

    const tmpl = loadTemplate(grayMatter.data.template);

    let processed = setMetadata(grayMatter.data, tmpl);
    processed = sassToCSS(processed);
    let postHTML = marked(grayMatter.content);
    processed = setMain(postHTML, processed);

    fse.outputFileSync(
      `${OUTPUT_DIR}/${post.fileName}/index.html`,
      processed,
      "utf8"
    );
  });
};

parseDoc();
