import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectsDirectory = path.join(process.cwd(), "src/content/projects");

describe("project content", () => {
  it("defines imageUrl for every curated project card", async () => {
    const filenames = await fs.readdir(projectsDirectory);
    const projectFiles = filenames.filter((filename) => filename.endsWith(".md"));
    const filesWithoutImages = [];

    for (const filename of projectFiles) {
      const contents = await fs.readFile(
        path.join(projectsDirectory, filename),
        "utf8",
      );

      if (!/^imageUrl:\s+".+"/m.test(contents)) {
        filesWithoutImages.push(filename);
      }
    }

    expect(filesWithoutImages).toEqual([]);
  });
});
