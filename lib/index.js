#!/usr/bin/env node
import fs from "fs";
import { marked } from "marked";
import * as matter from "gray-matter";
import { getPosts } from "./fileUtils.js";
import { processSASS } from "./processors/sass-processor.js";
import { loadTemplate, setMain, setMetadata, } from "./processors/template-processor.js";
import dotenv from "dotenv";
dotenv.config();
var OUTPUT_DIR = process.env.OUTPUT_DIR;
export var parseDoc = function () {
    var posts = getPosts();
    posts.forEach(function (post) {
        console.info("Processing ".concat(post.path));
        var fileContents = fs.readFileSync(post.path, "utf8");
        var grayMatter = matter.default(fileContents);
        if (!grayMatter.data.template) {
            throw new Error("Please specify a template using frontMatter for ".concat(post.path));
        }
        var tmpl = loadTemplate(grayMatter.data.template);
        var processed = setMetadata(grayMatter.data, tmpl);
        processed = processSASS(processed);
        var postHTML = marked(grayMatter.content);
        processed = setMain(postHTML, processed);
        fs.writeFileSync("".concat(OUTPUT_DIR, "/").concat(post.fileName, "/index.html"), processed, "utf8");
    });
};
parseDoc();
//# sourceMappingURL=index.js.map