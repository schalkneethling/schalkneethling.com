import klawSync from "klaw-sync";
import dotenv from "dotenv";
dotenv.config();

const POSTS_ROOT = process.env.POSTS_ROOT;

function getPosts() {
  const allPaths = klawSync(POSTS_ROOT, { nodir: true });
  let posts = [];

  posts = allPaths.map((entry) => {
    return {
      path: entry.path,
      fileName: entry.path.substring(
        entry.path.lastIndexOf("/") + 1,
        entry.path.lastIndexOf(".")
      ),
    };
  });

  return posts;
}

export { getPosts };
