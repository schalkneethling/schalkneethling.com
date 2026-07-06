import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectsDirectory = path.join(process.cwd(), "src/content/projects");

const starterProjectIds = [
  "css-community-reset",
  "ossreleasefeed-v2",
  "web-platform-pulse",
  "masonry-gridlanes-wc",
  "css-expect",
  "css-property-type-validator",
  "create-project-calavera",
  "css-benchpress",
  "css-custom-property-inspector",
  "common-components",
  "css-media-pseudo-polyfill",
  "skills-autoresearch-flue",
  "refined-plan-mode",
];

const projectGoalDocs = new Map([
  [
    "masonry-gridlanes-wc",
    "https://github.com/schalkneethling/masonry-gridlanes-wc/blob/main/GOAL.md",
  ],
  [
    "css-expect",
    "https://github.com/schalkneethling/css-expect/blob/main/GOAL.md",
  ],
  [
    "css-property-type-validator",
    "https://github.com/schalkneethling/css-property-type-validator/blob/main/GOAL.md",
  ],
  [
    "create-project-calavera",
    "https://github.com/schalkneethling/create-project-calavera/blob/main/GOAL.md",
  ],
  [
    "css-benchpress",
    "https://github.com/schalkneethling/css-benchpress/blob/main/GOAL.md",
  ],
  [
    "common-components",
    "https://github.com/schalkneethling/common-components/blob/main/GOAL.md",
  ],
  [
    "skills-autoresearch-flue",
    "https://github.com/schalkneethling/skills-autoresearch-flue/blob/main/GOAL.md",
  ],
  [
    "refined-plan-mode",
    "https://github.com/schalkneethling/refined-plan-mode/blob/main/GOAL.md",
  ],
]);

const projectRoadmaps = new Map([
  [
    "css-property-type-validator",
    "https://github.com/schalkneethling/css-property-type-validator/blob/main/ROADMAP.md",
  ],
  [
    "common-components",
    "https://github.com/schalkneethling/common-components/blob/main/ROADMAP.md",
  ],
]);

const projectLiveUrls = new Map([
  [
    "css-property-type-validator",
    "https://typedcss-validator.schalkneethling.com",
  ],
  ["create-project-calavera", "https://calavera.schalkneethling.com"],
  ["common-components", "https://schalkneethling.github.io/common-components/"],
]);

const readProjectFile = async (projectId: string) =>
  fs.readFile(path.join(projectsDirectory, `${projectId}.md`), "utf8");

const missingFrontmatterFields = (contents: string, fields: string[]) =>
  fields.filter((field) => !new RegExp(`^${field}:`, "m").test(contents));

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

  it("defines complete starter project detail content", async () => {
    const requiredFields = [
      "whatAndWhy",
      "goalSummary",
      "currentState",
      "nextSteps",
      "contributionGuidance",
      "technologies",
    ];
    const incompleteProjects = [];

    for (const projectId of starterProjectIds) {
      const contents = await readProjectFile(projectId);
      const missingFields = missingFrontmatterFields(contents, requiredFields);

      if (missingFields.length > 0) {
        incompleteProjects.push({ projectId, missingFields });
      }
    }

    expect(incompleteProjects).toEqual([]);
  });

  it("links starter project docs and live URLs where they are currently available", async () => {
    for (const [projectId, goalDocUrl] of projectGoalDocs) {
      const contents = await readProjectFile(projectId);

      expect(contents).toContain(`goalDocUrl: "${goalDocUrl}"`);
    }

    for (const [projectId, roadmapDocUrl] of projectRoadmaps) {
      const contents = await readProjectFile(projectId);

      expect(contents).toContain(`roadmapDocUrl: "${roadmapDocUrl}"`);
    }

    for (const [projectId, liveUrl] of projectLiveUrls) {
      const contents = await readProjectFile(projectId);

      expect(contents).toContain(`liveUrl: "${liveUrl}"`);
    }
  });
});
