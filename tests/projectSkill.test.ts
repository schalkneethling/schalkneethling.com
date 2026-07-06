import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const skillDirectory = path.join(
  process.cwd(),
  ".codex/skills/what-i-want-to-exist-projects",
);

async function readSkillFile(relativePath: string) {
  return fs.readFile(path.join(skillDirectory, relativePath), "utf8");
}

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n(?<frontmatter>[\s\S]*?)\n---/);

  if (!match?.groups?.frontmatter) {
    throw new Error("Missing frontmatter");
  }

  const frontmatter: Record<string, string> = {};

  for (const line of match.groups.frontmatter.split("\n")) {
    const lineMatch = line.match(/^(?<key>[a-z-]+):\s*(?<value>.+)$/);

    if (lineMatch?.groups) {
      frontmatter[lineMatch.groups.key] = lineMatch.groups.value;
    }
  }

  return frontmatter;
}

describe("what-i-want-to-exist-projects skill", () => {
  it("passes the core skill-creator frontmatter constraints", async () => {
    const skill = await readSkillFile("SKILL.md");
    const frontmatter = parseFrontmatter(skill);

    expect(Object.keys(frontmatter).sort()).toEqual(["description", "name"]);
    expect(frontmatter.name).toBe("what-i-want-to-exist-projects");
    expect(frontmatter.name).toMatch(/^[a-z0-9-]+$/);
    expect(frontmatter.description).toBeTypeOf("string");
    expect(frontmatter.description).not.toMatch(/[<>]/);
    expect(frontmatter.description.length).toBeLessThanOrEqual(1024);
  });

  it("defines trigger metadata for project content work", async () => {
    const skill = await readSkillFile("SKILL.md");

    expect(skill).toContain("name: what-i-want-to-exist-projects");
    expect(skill).toContain("src/content/projects/");
    expect(skill).toContain("src/data/project-doc-cache/");
    expect(skill).toContain("GOAL.md/ROADMAP.md");
  });

  it("documents the repeatable project update workflow", async () => {
    const skill = await readSkillFile("SKILL.md");

    expect(skill).toContain("Cards link to internal `/projects/{slug}` pages.");
    expect(skill).toContain("Every card needs an `imageUrl`.");
    expect(skill).toContain("pnpm run refresh:project-docs");
    expect(skill).toContain("pnpm run test:a11y");
  });

  it("includes project-entry reference details and UI metadata", async () => {
    const reference = await readSkillFile("references/project-entry.md");
    const metadata = await readSkillFile("agents/openai.yaml");

    expect(reference).toContain("Project entries live in");
    expect(reference).toContain("whatAndWhy");
    expect(reference).toContain("tests/projectContent.test.ts");
    expect(metadata).toContain("display_name: \"What I Want To Exist Projects\"");
    expect(metadata).toContain(
      "default_prompt: \"Use $what-i-want-to-exist-projects",
    );
  });
});
