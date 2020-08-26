const fse = require("fs-extra");
const klawSync = require("klaw-sync");

require("dotenv").config();

const POSTS_ROOT = process.env.POSTS_ROOT;

const fileUtils = {
  getPosts: () => {
    const allPaths = klawSync(POSTS_ROOT);
    let posts = [];

    posts = allPaths
      .filter((entry) => fse.statSync(entry.path).isFile())
      .map((entry) => {
        return {
          path: entry.path,
          fileName: entry.path.substring(
            entry.path.lastIndexOf("/") + 1,
            entry.path.lastIndexOf(".")
          ),
        };
      });

    return posts;
  },
};

module.exports = fileUtils;
