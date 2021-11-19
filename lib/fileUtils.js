import klawSync from "klaw-sync";
import dotenv from "dotenv";
dotenv.config();
var POSTS_ROOT = process.env.POSTS_ROOT;
function getPosts() {
    var allPaths = klawSync(POSTS_ROOT, { nodir: true });
    var posts = [];
    posts = allPaths.map(function (entry) {
        return {
            path: entry.path,
            fileName: entry.path.substring(entry.path.lastIndexOf("/") + 1, entry.path.lastIndexOf(".")),
        };
    });
    return posts;
}
export { getPosts };
//# sourceMappingURL=fileUtils.js.map