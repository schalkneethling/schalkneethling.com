#!/usr/bin/env node
import fs from "fs";
import { marked } from "marked";
import * as matter from "gray-matter";

import { getPosts } from "./fileUtils.js";
import { processSASS } from "./processors/sass-processor.js";
import {
  loadTemplate,
  setMain,
  setMetadata,
} from "./processors/template-processor.js";

import dotenv from "dotenv";
dotenv.config();

const OUTPUT_DIR = process.env.OUTPUT_DIR;

export const build = () => {
  const posts = getPosts();
  console.info(`Number of posts ${posts.length}`);

  posts.forEach((post) => {
    console.info(`Processing ${post.path}`);
    const fileContents = fs.readFileSync(post.path, "utf8");
    const grayMatter = matter.default(fileContents);

    if (!grayMatter.data.template) {
      throw new Error(
        `Please specify a template using frontMatter for ${post.path}`
      );
    }

    const tmpl = loadTemplate(grayMatter.data.template);

    let processed = setMetadata(grayMatter.data, tmpl);
    processed = processSASS(processed);
    let postHTML = marked(grayMatter.content);
    processed = setMain(postHTML, processed);

    fs.writeFileSync(
      `${OUTPUT_DIR}/${post.fileName}/index.html`,
      processed,
      "utf8"
    );
  });
};

build();
