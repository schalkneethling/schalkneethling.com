"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = void 0;
const klaw_sync_1 = __importDefault(require("klaw-sync"));
require("dotenv").config();
const POSTS_ROOT = process.env.POSTS_ROOT;
function getPosts() {
    const allPaths = klaw_sync_1.default(POSTS_ROOT, { nodir: true });
    let posts = [];
    posts = allPaths.map((entry) => {
        return {
            path: entry.path,
            fileName: entry.path.substring(entry.path.lastIndexOf("/") + 1, entry.path.lastIndexOf(".")),
        };
    });
    return posts;
}
exports.getPosts = getPosts;
//# sourceMappingURL=fileUtils.js.map