#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const marked_1 = __importDefault(require("marked"));
const matter = __importStar(require("gray-matter"));
const fileUtils_1 = require("./fileUtils");
const template_processor_1 = require("./processors/template-processor");
require("dotenv").config();
const OUTPUT_DIR = process.env.OUTPUT_DIR;
const parseDoc = () => {
    const posts = (0, fileUtils_1.getPosts)();
    posts.forEach((post) => {
        console.info(`Processing ${post.path}`);
        const fileContents = fs_extra_1.default.readFileSync(post.path, "utf-8");
        const grayMatter = matter.default(fileContents);
        if (!grayMatter.data.template) {
            throw new Error(`Please specify a template using frontMatter for ${post.path}`);
        }
        const tmpl = (0, template_processor_1.loadTemplate)(grayMatter.data.template);
        let processed = (0, template_processor_1.setMetadata)(grayMatter.data, tmpl);
        processed = (0, template_processor_1.sassToCSS)(tmpl);
        let postHTML = (0, marked_1.default)(grayMatter.content);
        processed = (0, template_processor_1.setMain)(postHTML, processed);
        fs_extra_1.default.outputFileSync(`${OUTPUT_DIR}/${post.fileName}/index.html`, processed, "utf-8");
    });
};
parseDoc();
module.exports = parseDoc;
//# sourceMappingURL=index.js.map