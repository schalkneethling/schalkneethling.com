#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const marked_1 = __importDefault(require("marked"));
const fileUtils_1 = require("./fileUtils");
const { addMain, loadTemplate } = require("./processors/template-processor");
require("dotenv").config();
const OUTPUT_DIR = process.env.OUTPUT_DIR;
const parseDoc = () => {
    const posts = fileUtils_1.getPosts();
    const tmpl = loadTemplate();
    posts.forEach((post) => {
        let markdown = marked_1.default(fs_extra_1.default.readFileSync(post.path, "utf-8"));
        let processed = addMain(markdown, tmpl);
        fs_extra_1.default.outputFileSync(`${OUTPUT_DIR}/${post.fileName}.html`, processed, "utf-8");
    });
};
parseDoc();
module.exports = parseDoc;
//# sourceMappingURL=index.js.map